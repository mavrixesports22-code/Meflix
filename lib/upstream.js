// Finite, idempotent upstream reads. No source URL or credential is logged.
class ServiceError extends Error {
  constructor(message, status = 502, code = status >= 500 ? 'SOURCE_UNAVAILABLE' : 'REQUEST_ERROR', retryable = status >= 500, upstreamStatus = null) {
    super(message);
    Object.assign(this, { status, code, retryable, upstreamStatus });
  }
}
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}
function createTransport({ fetchImpl = fetch, validateUrl, sleep = delay }) {
  return async function request(value, options = {}) {
    // consume runs inside the same attempt as headers, before callers emit any
    // downstream bytes. Its body failures share the existing request budget.
    const { attempts = 3, timeoutMs = 8000, signal, consume, ...fetchOptions } = options;
    if (options.method && options.method !== 'GET' && options.method !== 'HEAD') throw new ServiceError('Only read requests may be retried.', 400);
    let last;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (signal?.aborted) throw signal.reason;
      try {
        let url = await validateUrl(value);
        let headers = new Headers(options.headers);
        for (let hop = 0; hop < 5; hop++) {
          const deadline = AbortSignal.timeout(timeoutMs);
          const response = await fetchImpl(url, { ...fetchOptions, headers, redirect: 'manual', signal: signal ? AbortSignal.any([signal, deadline]) : deadline });
          if ([301,302,303,307,308].includes(response.status)) {
            const location = response.headers.get('location');
            await response.body?.cancel();
            if (!location) throw new ServiceError('The video service returned an invalid redirect.');
            const next = await validateUrl(new URL(location, url).href);
            if (next.origin !== url.origin) {
              headers = new Headers(headers);
              for (const name of ['Usertoken','Otp','Authorization','Cookie']) headers.delete(name);
            }
            url = next;
            continue;
          }
          if (!response.ok) {
            await response.body?.cancel();
            const retryable = [408,425,429,500,502,503,504].includes(response.status);
            const code = response.status === 403 ? 'UPSTREAM_FORBIDDEN' : 'SOURCE_UNAVAILABLE';
            throw new ServiceError(`Video service returned HTTP ${response.status}.`, 502, code, retryable, response.status);
          }
          if (!consume) return response;
          try { return await consume(response); }
          catch (error) {
            // A streaming consumer owns cancellation while it holds a reader.
            if (!response.body?.locked) await response.body?.cancel().catch(() => {});
            throw error;
          }
        }
        throw new ServiceError('Too many media redirects.', 502, 'SOURCE_UNAVAILABLE', false);
      } catch (error) {
        if (signal?.aborted) throw signal.reason;
        last = error instanceof ServiceError ? error : new ServiceError('The video service did not respond. Try again shortly.');
        if (!last.retryable || attempt === attempts - 1) throw last;
        await sleep(250 * (attempt + 1), signal);
      }
    }
    throw last;
  };
}
module.exports = { createTransport, ServiceError };

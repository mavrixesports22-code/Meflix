export async function adminApi(action, body, auth, fetcher = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const token = action === 'login' ? null : await auth?.currentUser?.getIdToken();
    if (action !== 'login' && !token) throw new Error('Enter your PIN to continue.');
    const response = await fetcher(`/api/admin/${action}`, {
      method: body ? 'POST' : 'GET',
      headers: { ...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}) },
      ...(body ? {body:JSON.stringify(body)} : {}), signal:controller.signal,
    });
    let data;
    try {
      data = await response.json();
    } catch {
      let preview = '';
      try {
        if (typeof response.text === 'function') preview = await response.text();
      } catch {}
      throw new Error(response.ok ? 'Unexpected response format.' : `Server error (${response.status})${preview ? ': ' + preview.slice(0, 100) : ''}`);
    }
    if (!response.ok) throw new Error(data?.error || 'Console request failed.');
    return data;
  } finally { clearTimeout(timer); }
}
export async function verifyAdminSession(auth, fetcher) {
  const user = auth?.currentUser;
  if (!user || user.uid !== 'meflix-admin-console') throw new Error('Enter your admin PIN.');
  const result = await user.getIdTokenResult();
  if (result.claims.admin !== true) throw new Error('Administrator access is required.');
  await adminApi('session', null, auth, fetcher);
}

// Only normalized public catalogue metadata belongs here. Never persist auth.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', '.runtime', 'netflix-catalog.json');
const tmpFile = path.join('/tmp', 'netflix-catalog.json');

let pending;
function read() {
  try {
    if (fs.existsSync(tmpFile)) {
      const stat = fs.statSync(tmpFile);
      if (stat.size <= 30 * 1024 * 1024) {
        const val = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
        if (val.version === 1 && Array.isArray(val.titles)) return val;
      }
    }
  } catch {}

  try {
    const stat = fs.statSync(file);
    if (stat.size > 30 * 1024 * 1024) return null;
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return value.version === 1 && Array.isArray(value.titles) ? value : null;
  } catch { return null; }
}

function write(value) {
  clearTimeout(pending);
  pending = setTimeout(() => {
    const target = process.env.VERCEL ? tmpFile : file;
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target + '.tmp', JSON.stringify({ version: 1, ...value }));
      fs.renameSync(target + '.tmp', target);
    } catch {
      try {
        fs.writeFileSync(tmpFile + '.tmp', JSON.stringify({ version: 1, ...value }));
        fs.renameSync(tmpFile + '.tmp', tmpFile);
      } catch {
        /* A read-only cache must not prevent live playback. */
      }
    }
  }, 500);
  if (pending && pending.unref) pending.unref();
}

module.exports = { read, write };

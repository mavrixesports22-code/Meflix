const fs = require('node:fs');
const path = require('node:path');

function loadLocalEnvironment(directory) {
  // Existing shell values win; local overrides take priority over .env defaults.
  for (const name of ['.env.local', '.env']) {
    const file = path.join(directory, name);
    if (fs.existsSync(file)) process.loadEnvFile(file);
  }
}

module.exports = { loadLocalEnvironment };

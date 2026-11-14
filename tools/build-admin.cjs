const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(root, 'src', 'index.jsx')],
    bundle: true,
    format: 'esm',
    target: ['es2022'],
    outfile: path.join(root, 'public', 'admin.js'),
    external: [
      'https://www.gstatic.com/*',
      './firebase-config.js'
    ],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/client': 'preact/compat',
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    banner: {
      js: 'if(typeof queueMicrotask==="undefined"){const qm=(fn)=>Promise.resolve().then(fn);try{window.queueMicrotask=qm;}catch{}try{globalThis.queueMicrotask=qm;}catch{}}'
    },
    minify: true,
    treeShaking: true,
    legalComments: 'eof',
  });

  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  for (const name of ['index.html', 'admin.css', 'admin.js', 'model.js', 'firebase-config.js', 'google-signin.html', 'google-signin.js', 'google-signin.css', 'google-callback.html']) {
    fs.copyFileSync(path.join(root, 'public', name), path.join(root, 'dist', name));
  }
  const css=await esbuild.transform(fs.readFileSync(path.join(root,'public','admin.css'),'utf8'),{loader:'css',minify:true});
  fs.writeFileSync(path.join(root,'dist','admin.css'),css.code);
  console.log('Admin React assets built successfully in public/ and dist/');

  // Bundle serverless API handler for Vercel to eliminate runtime ESM require conflicts (jwks-rsa / jose)
  await esbuild.build({
    entryPoints: [path.join(root, 'lib', 'admin-handler-entry.cjs')],
    bundle: true,
    platform: 'node',
    target: ['node20'],
    format: 'cjs',
    outfile: path.join(root, 'api', 'admin', '[action].js'),
    minify: true,
  });
  console.log('Serverless admin handler bundled successfully in api/admin/[action].js');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

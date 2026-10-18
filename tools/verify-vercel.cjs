const assert = require('node:assert/strict');
const http = require('node:http');

async function testVercelServerlessFunction() {
  const handler = require('../api/netmirror/[...path].js');
  
  // Test 1: GET /api/netmirror/health
  {
    const req = {
      url: '/api/netmirror/health',
      method: 'GET',
      headers: { host: 'meflix.vercel.app' }
    };
    let statusCode = 0;
    let headers = {};
    let body = '';
    const res = {
      writeHead(code, h) { statusCode = code; if (h) Object.assign(headers, h); },
      setHeader(k, v) { headers[k] = v; },
      end(data) { if (data) body += data; }
    };

    await handler(req, res);
    assert.equal(statusCode, 200, 'Health check must return 200');
    const data = JSON.parse(body);
    assert.equal(data.provider, 'NetMirror');
    console.log('✔ Vercel Function: /api/netmirror/health succeeded');
  }

  // Test 2: GET /api/netmirror/home
  {
    const req = {
      url: '/api/netmirror/home',
      method: 'GET',
      headers: { host: 'meflix.vercel.app' }
    };
    let statusCode = 0;
    let headers = {};
    let body = '';
    const res = {
      writeHead(code, h) { statusCode = code; if (h) Object.assign(headers, h); },
      setHeader(k, v) { headers[k] = v; },
      end(data) { if (data) body += data; }
    };

    await handler(req, res);
    assert.equal(statusCode, 200, 'Home catalog must return 200');
    const data = JSON.parse(body);
    assert.ok(Array.isArray(data.shelves), 'Shelves must be an array');
    assert.ok(data.shelves.length > 0, 'Shelves must not be empty');
    assert.ok(Array.isArray(data.items), 'Items must be an array');
    console.log(`✔ Vercel Function: /api/netmirror/home loaded ${data.shelves.length} shelves and ${data.items.length} titles`);
  }

  // Test 3: Origin check on *.vercel.app
  {
    const req = {
      url: '/api/netmirror/home',
      method: 'GET',
      headers: {
        host: 'meflix-mavrix.vercel.app',
        origin: 'https://meflix-mavrix.vercel.app'
      }
    };
    let statusCode = 0;
    let headers = {};
    let body = '';
    const res = {
      writeHead(code, h) { statusCode = code; if (h) Object.assign(headers, h); },
      setHeader(k, v) { headers[k] = v; },
      end(data) { if (data) body += data; }
    };

    await handler(req, res);
    assert.equal(statusCode, 200, 'Vercel preview origin must be permitted');
    console.log('✔ Vercel Function: Origin verification for *.vercel.app passed');
  }

  // Test 4: Health API
  {
    const healthHandler = require('../api/health.js');
    let statusCode = 0;
    let headers = {};
    let body = '';
    const res = {
      writeHead(code, h) { statusCode = code; if (h) Object.assign(headers, h); },
      setHeader(k, v) { headers[k] = v; },
      end(data) { if (data) body += data; }
    };
    await healthHandler({}, res);
    assert.equal(statusCode, 200);
    const data = JSON.parse(body);
    assert.equal(data.service, 'Meflix');
    console.log('✔ Vercel Function: /api/health succeeded');
  }

  console.log('\n🎉 ALL VERCEL PRODUCTION SERVERLESS CHECKS PASSED!\n');
}

testVercelServerlessFunction().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

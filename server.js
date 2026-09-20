// ==========================================================================
// PRUPROSPECT PRO - MAIN SERVER ENTRYPOINT
// Clean separation: API Router (backend/) + Static File Server (frontend/)
// ==========================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './backend/config.js';
import { initDatabase } from './backend/database.js';
import { handleApiRoute } from './backend/routes/apiRouter.js';
import { sendJson } from './backend/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database schema & seeds
initDatabase();

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Static File Server
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  // Prevent directory traversal
  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing to index.html if not an asset
      if (!path.extname(pathname)) {
        const indexPath = path.join(__dirname, 'index.html');
        return fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          });
          return res.end(content);
        });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`File ${pathname} tidak ditemukan.`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error: Gagal membaca file.');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      return res.end(content);
    });
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Route to Backend API Router
    if (pathname.startsWith('/api')) {
      return await handleApiRoute(req, res, pathname, url);
    }

    // Route to Frontend Static Files
    return serveStaticFile(req, res, pathname);
  } catch (err) {
    console.error('Server Internal Error:', err);
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(config.port, () => {
  console.log('========================================================');
  console.log(`🚀 PruProspect Pro Running on http://localhost:${config.port}`);
  console.log(`   Architecture: Modular Backend (backend/) + SPA Frontend`);
  console.log(`   Database: SQLite (${config.dbPath})`);
  console.log('========================================================');
});

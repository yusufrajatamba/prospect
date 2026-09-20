// ==========================================================================
// PRUPROSPECT PRO - BACKEND CONFIGURATION
// ==========================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: process.env.PORT || 4173,
  rootDir,
  dbPath: path.join(rootDir, 'prudential.db'),
  jwtSecret: 'pru_secret_key_cfpesq_2026',
  cors: {
    origin: '*',
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    headers: 'Content-Type, Authorization'
  }
};

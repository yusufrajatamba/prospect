// ==========================================================================
// PRUPROSPECT PRO - CENTRALIZED REST API ROUTER
// ==========================================================================

import { sendJson, authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as prospectController from '../controllers/prospectController.js';
import * as policyController from '../controllers/policyController.js';
import * as goalController from '../controllers/goalController.js';
import * as playbookController from '../controllers/playbookController.js';
import * as calcController from '../controllers/calcController.js';
import * as dashboardController from '../controllers/dashboardController.js';

export async function handleApiRoute(req, res, pathname, url) {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // 2. Public Auth Routes
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    return await authController.handleLogin(req, res);
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    return await authController.handleRegister(req, res);
  }

  // 3. Authenticate User Context
  const currentUser = authenticate(req);
  if (!currentUser) {
    return sendJson(res, 401, { error: 'Silakan login terlebih dahulu untuk mengakses data.' });
  }

  // 4. Authenticated Auth Routes
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    return authController.handleGetMe(req, res);
  }

  // 5. Dashboard Stats
  if (pathname === '/api/dashboard/stats' && req.method === 'GET') {
    return dashboardController.handleGetStats(req, res, currentUser);
  }

  // 6. Prospects Endpoints
  if (pathname === '/api/prospects' && req.method === 'GET') {
    return prospectController.handleListProspects(req, res, currentUser);
  }

  if (pathname === '/api/prospects' && req.method === 'POST') {
    return await prospectController.handleCreateProspect(req, res, currentUser);
  }

  const prospectStageMatch = pathname.match(/^\/api\/prospects\/([a-zA-Z0-9_-]+)\/stage$/);
  if (prospectStageMatch && req.method === 'PUT') {
    return await prospectController.handleUpdateStage(req, res, currentUser, prospectStageMatch[1]);
  }

  const prospectInteractionMatch = pathname.match(/^\/api\/prospects\/([a-zA-Z0-9_-]+)\/interactions$/);
  if (prospectInteractionMatch && req.method === 'POST') {
    return await prospectController.handleAddInteraction(req, res, currentUser, prospectInteractionMatch[1]);
  }

  const prospectMatch = pathname.match(/^\/api\/prospects\/([a-zA-Z0-9_-]+)$/);
  if (prospectMatch && req.method === 'PUT') {
    return await prospectController.handleUpdateProspect(req, res, currentUser, prospectMatch[1]);
  }

  if (prospectMatch && req.method === 'DELETE') {
    return prospectController.handleDeleteProspect(req, res, currentUser, prospectMatch[1]);
  }

  // 7. Policies Endpoints
  if (pathname === '/api/policies' && req.method === 'GET') {
    return policyController.handleListPolicies(req, res, currentUser);
  }

  if (pathname === '/api/policies' && req.method === 'POST') {
    return await policyController.handleCreatePolicy(req, res, currentUser);
  }

  const policyMatch = pathname.match(/^\/api\/policies\/([a-zA-Z0-9_-]+)$/);
  if (policyMatch && req.method === 'PUT') {
    return await policyController.handleUpdatePolicy(req, res, currentUser, policyMatch[1]);
  }

  if (policyMatch && req.method === 'DELETE') {
    return policyController.handleDeletePolicy(req, res, currentUser, policyMatch[1]);
  }

  // 8. Dynamic Goals Endpoints
  if (pathname === '/api/goals' && req.method === 'GET') {
    return goalController.handleListGoals(req, res, currentUser);
  }

  if (pathname === '/api/goals' && req.method === 'POST') {
    return await goalController.handleCreateGoal(req, res, currentUser);
  }

  const goalMatch = pathname.match(/^\/api\/goals\/([a-zA-Z0-9_-]+)$/);
  if (goalMatch && req.method === 'PUT') {
    return await goalController.handleUpdateGoal(req, res, currentUser, goalMatch[1]);
  }

  if (goalMatch && req.method === 'DELETE') {
    return goalController.handleDeleteGoal(req, res, currentUser, goalMatch[1]);
  }

  // 9. Playbook Endpoints
  if (pathname === '/api/playbook' && req.method === 'GET') {
    return playbookController.handleListPlaybook(req, res, currentUser);
  }

  if (pathname === '/api/playbook' && req.method === 'POST') {
    return await playbookController.handleCreatePlaybook(req, res, currentUser);
  }

  if (pathname === '/api/playbook/generate-ai' && req.method === 'POST') {
    return await playbookController.handleGenerateAI(req, res);
  }

  const pbMatch = pathname.match(/^\/api\/playbook\/([a-zA-Z0-9_-]+)$/);
  if (pbMatch && req.method === 'DELETE') {
    return playbookController.handleDeletePlaybook(req, res, currentUser, pbMatch[1]);
  }

  // 10. Financial Calculations Endpoints
  if (pathname === '/api/calculations/save' && req.method === 'POST') {
    return await calcController.handleSaveCalculation(req, res, currentUser);
  }

  if (pathname === '/api/calculations' && req.method === 'GET') {
    return calcController.handleListCalculations(req, res, currentUser, url);
  }

  // 11. System Maintenance / Data Reset
  if (pathname === '/api/system/reset-data' && req.method === 'POST') {
    const { resetAllProspectAndPolicyData } = await import('../database.js');
    resetAllProspectAndPolicyData();
    return sendJson(res, 200, { success: true, message: 'Seluruh data prospek, interaksi, polis, dan kalkulasi berhasil direset.' });
  }

  // Route not found in API
  return sendJson(res, 404, { error: `Endpoint API tidak ditemukan: ${req.method} ${pathname}` });
}

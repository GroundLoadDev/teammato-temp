import { Router } from "express";
import { ensureOrgDEK, rewrapOrgDEK } from "../utils/keys";

const router = Router();

function requireAdminToken(req: any, res: any, next: any) {
  const token = req.headers['x-admin-token'];
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    return res.status(500).json({ error: 'ADMIN_TOKEN not configured' });
  }
  
  if (token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

router.post('/ensure', requireAdminToken, async (req, res) => {
  try {
    const { orgId } = req.body;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId required' });
    }
    
    await ensureOrgDEK(orgId);
    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Ensure DEK error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/rewrap', requireAdminToken, async (req, res) => {
  try {
    const { orgId } = req.body;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId required' });
    }
    
    const result = await rewrapOrgDEK(orgId);
    return res.json({ ok: result });
  } catch (error: any) {
    console.error('Rewrap DEK error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

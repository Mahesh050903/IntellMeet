import { Router, Request, Response } from 'express';
import { getDBStatus } from '../config/db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDBStatus();
  res.status(200).json({
    success: true,
    service: 'IntellMeet API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;

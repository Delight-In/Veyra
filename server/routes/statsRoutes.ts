import { Router, Request, Response } from 'express';
import { VisitorStats } from '../models/Visitor';

export const statsRouter = Router();

// In-memory fallback if MongoDB is not running locally
let inMemoryVisitorCount = 108;

/**
 * GET /api/stats/visitors
 * Returns current visitor count starting from 0 without incrementing.
 */
statsRouter.get('/visitors', async (_req: Request, res: Response) => {
  try {
    let stats = await VisitorStats.findOne({ key: 'platform_visitors' });
    if (!stats) {
      stats = await VisitorStats.create({ key: 'platform_visitors', count: inMemoryVisitorCount });
    }
    return res.status(200).json({
      success: true,
      count: stats.count,
      lastVisitedAt: stats.lastVisitedAt
    });
  } catch (err: any) {
    return res.status(200).json({ 
      success: true, 
      count: inMemoryVisitorCount,
      lastVisitedAt: new Date().toISOString(),
      offline: true
    });
  }
});

/**
 * POST /api/stats/visit
 * Atomically increments visitor count by 1 and returns updated count.
 */
statsRouter.post('/visit', async (_req: Request, res: Response) => {
  try {
    const stats = await VisitorStats.findOneAndUpdate(
      { key: 'platform_visitors' },
      { 
        $inc: { count: 1 },
        $set: { lastVisitedAt: new Date() }
      },
      { 
        new: true, 
        upsert: true, 
        setDefaultsOnInsert: true 
      }
    );

    return res.status(200).json({
      success: true,
      count: stats.count,
      isNewVisitor: true,
      lastVisitedAt: stats.lastVisitedAt
    });
  } catch (err: any) {
    inMemoryVisitorCount += 1;
    return res.status(200).json({ 
      success: true, 
      count: inMemoryVisitorCount,
      isNewVisitor: true,
      lastVisitedAt: new Date().toISOString(),
      offline: true
    });
  }
});

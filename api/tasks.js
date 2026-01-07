import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// New keys for multi-milestone structure
const MILESTONES_KEY = 'vacation-tracker:milestones';
const LAST_VIEW_KEY = 'vacation-tracker:lastView';

// Legacy keys (for migration)
const LEGACY_TASKS_KEY = 'vacation-tracker:tasks';
const LEGACY_GOAL_KEY = 'vacation-tracker:goal';
const LEGACY_NOTES_KEY = 'vacation-tracker:standaloneNotes';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Check for new multi-milestone structure first
      let milestones = await redis.get(MILESTONES_KEY);
      let lastView = await redis.get(LAST_VIEW_KEY);
      
      // If no milestones exist, check for legacy data and migrate
      if (!milestones) {
        const legacyTasks = await redis.get(LEGACY_TASKS_KEY);
        const legacyGoal = await redis.get(LEGACY_GOAL_KEY);
        const legacyNotes = await redis.get(LEGACY_NOTES_KEY);
        
        if (legacyTasks || legacyGoal) {
          // Migrate legacy data to new structure
          const migratedMilestone = {
            id: 'migrated-' + Date.now(),
            title: legacyGoal?.title || 'Vacation Goals',
            startDate: legacyGoal?.startDate || '2025-12-21',
            endDate: legacyGoal?.endDate || '2026-01-07',
            tasks: legacyTasks || [],
            standaloneNotes: legacyNotes || [],
            createdAt: new Date().toISOString()
          };
          
          milestones = [migratedMilestone];
          lastView = { view: 'milestone', milestoneId: migratedMilestone.id };
          
          // Save migrated data
          await redis.set(MILESTONES_KEY, milestones);
          await redis.set(LAST_VIEW_KEY, lastView);
          
          // Optionally clean up legacy keys (commented out for safety)
          // await redis.del(LEGACY_TASKS_KEY);
          // await redis.del(LEGACY_GOAL_KEY);
          // await redis.del(LEGACY_NOTES_KEY);
        }
      }
      
      return res.status(200).json({
        milestones: milestones || [],
        lastView: lastView || { view: 'dashboard' }
      });
    }

    if (req.method === 'POST') {
      const { milestones, lastView } = req.body;
      
      if (milestones !== undefined) {
        await redis.set(MILESTONES_KEY, milestones);
      }
      
      if (lastView !== undefined) {
        await redis.set(LAST_VIEW_KEY, lastView);
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}

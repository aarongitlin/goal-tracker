import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Key generators with user namespace
const getKeys = (userId) => ({
  milestones: `user:${userId}:milestones`,
  lastView: `user:${userId}:lastView`,
});

// Legacy keys (for migration of original user)
const LEGACY_TASKS_KEY = 'vacation-tracker:tasks';
const LEGACY_GOAL_KEY = 'vacation-tracker:goal';
const LEGACY_NOTES_KEY = 'vacation-tracker:standaloneNotes';
const LEGACY_MILESTONES_KEY = 'vacation-tracker:milestones';
const LEGACY_LAST_VIEW_KEY = 'vacation-tracker:lastView';

// Original user ID for migration (your data)
const ORIGINAL_USER_ID = 'original-user';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get userId from query (GET) or body (POST)
  const userId = req.method === 'GET' 
    ? req.query.userId 
    : req.body?.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const keys = getKeys(userId);

  try {
    if (req.method === 'GET') {
      let milestones = await redis.get(keys.milestones);
      let lastView = await redis.get(keys.lastView);
      
      // Special migration for original user: check legacy keys
      if (!milestones && userId === ORIGINAL_USER_ID) {
        // First check if there's data in the old multi-milestone format
        const legacyMilestones = await redis.get(LEGACY_MILESTONES_KEY);
        const legacyLastView = await redis.get(LEGACY_LAST_VIEW_KEY);
        
        if (legacyMilestones) {
          milestones = legacyMilestones;
          lastView = legacyLastView;
        } else {
          // Check for even older single-milestone format
          const legacyTasks = await redis.get(LEGACY_TASKS_KEY);
          const legacyGoal = await redis.get(LEGACY_GOAL_KEY);
          const legacyNotes = await redis.get(LEGACY_NOTES_KEY);
          
          if (legacyTasks || legacyGoal) {
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
          }
        }
        
        // Save migrated data to new namespaced keys
        if (milestones) {
          await redis.set(keys.milestones, milestones);
          await redis.set(keys.lastView, lastView);
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
        await redis.set(keys.milestones, milestones);
      }
      
      if (lastView !== undefined) {
        await redis.set(keys.lastView, lastView);
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}

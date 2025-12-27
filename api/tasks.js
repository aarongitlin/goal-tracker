import { Redis } from '@upstash/redis';

// Vercel Redis integration may use different env var names
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TASKS_KEY = 'vacation-tracker:tasks';
const GOAL_KEY = 'vacation-tracker:goal';

const DEFAULT_GOAL = { 
  title: 'Vacation Goals', 
  startDate: '2025-12-21', 
  endDate: '2026-01-07' 
};

export default async function handler(req, res) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const tasks = await redis.get(TASKS_KEY);
      const goal = await redis.get(GOAL_KEY);
      
      return res.status(200).json({
        tasks: tasks || null,
        goal: goal || DEFAULT_GOAL
      });
    }

    if (req.method === 'POST') {
      const { tasks, goal } = req.body;
      
      if (tasks !== undefined) {
        await redis.set(TASKS_KEY, tasks);
      }
      
      if (goal !== undefined) {
        await redis.set(GOAL_KEY, goal);
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
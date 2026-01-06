export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tasks, standaloneNotes, goal } = req.body;

  if (!tasks || !goal) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  // Build the prompt
  const STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETE: 'complete'
  };

  const completedTasks = tasks.filter(t => t.status === STATUS.COMPLETE);
  const inProgressTasks = tasks.filter(t => t.status === STATUS.IN_PROGRESS);
  const notStartedTasks = tasks.filter(t => t.status === STATUS.NOT_STARTED);

  // Gather all notes
  const taskNotes = tasks.flatMap(task =>
    (task.notes || []).map(note => ({
      content: note.content,
      date: note.date,
      taskTitle: task.title
    }))
  );

  const allNotes = [
    ...taskNotes,
    ...(standaloneNotes || []).map(n => ({ content: n.content, date: n.date, taskTitle: null }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate stats
  const allItems = tasks.flatMap(t => [t, ...(t.subtasks || [])]);
  const completedItems = allItems.filter(i => i.status === STATUS.COMPLETE).length;
  const completionRate = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;

  const startDateFormatted = new Date(goal.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const endDateFormatted = new Date(goal.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const prompt = `You are helping someone reflect on their goal-tracking milestone. Here's their data:

**Goal:** ${goal.title}
**Period:** ${startDateFormatted} to ${endDateFormatted}
**Overall Completion:** ${completionRate}% (${completedItems}/${allItems.length} items)

**Completed Tasks (${completedTasks.length}):**
${completedTasks.map(t => `- ${t.title}${t.subtasks && t.subtasks.length > 0 ? ` (${t.subtasks.filter(s => s.status === STATUS.COMPLETE).length}/${t.subtasks.length} subtasks)` : ''}`).join('\n') || '(none)'}

**In Progress (${inProgressTasks.length}):**
${inProgressTasks.map(t => `- ${t.title}`).join('\n') || '(none)'}

**Not Started (${notStartedTasks.length}):**
${notStartedTasks.map(t => `- ${t.title}`).join('\n') || '(none)'}

**Journal Notes (${allNotes.length} entries):**
${allNotes.slice(0, 15).map(n => `- [${n.date}]${n.taskTitle ? ` (${n.taskTitle})` : ''}: "${n.content}"`).join('\n') || '(no notes)'}
${allNotes.length > 15 ? `\n... and ${allNotes.length - 15} more notes` : ''}

Please write a warm, reflective summary (3-4 paragraphs) that:
1. Celebrates what was accomplished
2. Notes any patterns or themes from the notes and tasks
3. Gently acknowledges what didn't get done without being critical
4. Offers an encouraging perspective on the journey

Keep the tone personal, warm, and supportive—like a thoughtful friend helping them reflect. Don't use bullet points. Don't start with "Great job!" or similar. Be genuine and specific to their actual accomplishments.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to generate summary' });
    }

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
      return res.status(200).json({ summary: data.content[0].text });
    } else {
      return res.status(500).json({ error: 'Unexpected response format' });
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}

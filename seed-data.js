// Run this in browser console at http://localhost:5174 to seed sample data
// Or copy the JSON and paste into localStorage

const sampleMilestones = [
  {
    id: '1',
    title: 'Japan Trip 2026',
    startDate: '2026-01-01',
    endDate: '2026-02-15',
    createdAt: '2025-12-01T10:00:00Z',
    standaloneNotes: [
      { id: 'sn1', content: 'Remember to check visa requirements for 90-day stay', date: '2026-01-05', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'sn2', content: 'Flight prices seem best on Tuesdays - keep checking', date: '2026-01-08', createdAt: '2026-01-08T14:00:00Z' }
    ],
    tasks: [
      {
        id: 't1',
        title: 'Book flights to Tokyo',
        status: 'complete',
        tags: ['Travel', 'Planning'],
        dueDate: '2026-01-10',
        subtasks: [],
        notes: [{ id: 'n1', content: 'Found great deal on ANA - $890 round trip!', date: '2026-01-08', createdAt: '2026-01-08T10:00:00Z' }]
      },
      {
        id: 't2',
        title: 'Research neighborhoods in Kyoto',
        status: 'in_progress',
        tags: ['Travel', 'Learning'],
        dueDate: '2026-01-20',
        subtasks: [
          { id: 't2-1', title: 'Gion district - geisha culture', status: 'complete' },
          { id: 't2-2', title: 'Arashiyama bamboo grove', status: 'complete' },
          { id: 't2-3', title: 'Fushimi Inari shrine area', status: 'in_progress' },
          { id: 't2-4', title: 'Higashiyama historic district', status: 'not_started' }
        ],
        notes: []
      },
      {
        id: 't3',
        title: 'Learn 50 essential Japanese phrases',
        status: 'in_progress',
        tags: ['Learning', 'Personal'],
        dueDate: '2026-02-01',
        subtasks: [
          { id: 't3-1', title: 'Basic greetings (10 phrases)', status: 'complete' },
          { id: 't3-2', title: 'Restaurant & food (15 phrases)', status: 'in_progress' },
          { id: 't3-3', title: 'Directions & transit (10 phrases)', status: 'not_started' },
          { id: 't3-4', title: 'Shopping & numbers (15 phrases)', status: 'not_started' }
        ],
        notes: [
          { id: 'n2', content: 'Pimsleur app is working great - 15 min/day', date: '2026-01-05', createdAt: '2026-01-05T08:00:00Z' },
          { id: 'n3', content: 'Added Anki flashcards for kanji recognition', date: '2026-01-09', createdAt: '2026-01-09T19:00:00Z' }
        ]
      },
      {
        id: 't4',
        title: 'Get travel insurance',
        status: 'not_started',
        tags: ['Planning'],
        dueDate: '2026-01-15',
        subtasks: [],
        notes: []
      },
      {
        id: 't5',
        title: 'Reserve ryokan in Hakone',
        status: 'not_started',
        tags: ['Travel', 'Planning'],
        dueDate: '2026-01-25',
        subtasks: [],
        notes: [{ id: 'n4', content: 'Gora Kadan looks amazing but expensive. Checking alternatives with private onsen.', date: '2026-01-09', createdAt: '2026-01-09T14:00:00Z' }]
      },
      {
        id: 't6',
        title: 'Purchase JR Rail Pass',
        status: 'not_started',
        tags: ['Travel'],
        dueDate: '2026-02-01',
        subtasks: [],
        notes: []
      }
    ]
  },
  {
    id: '2',
    title: 'Q1 Fitness Goals',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    createdAt: '2025-12-28T10:00:00Z',
    standaloneNotes: [],
    tasks: [
      {
        id: 't7',
        title: 'Run 100 miles total',
        status: 'in_progress',
        tags: ['Health'],
        dueDate: null,
        subtasks: [
          { id: 't7-1', title: 'January: 30 miles', status: 'in_progress' },
          { id: 't7-2', title: 'February: 35 miles', status: 'not_started' },
          { id: 't7-3', title: 'March: 35 miles', status: 'not_started' }
        ],
        notes: [{ id: 'n5', content: 'Week 1: 8 miles completed. On track!', date: '2026-01-07', createdAt: '2026-01-07T18:00:00Z' }]
      },
      {
        id: 't8',
        title: 'Complete 30-day yoga challenge',
        status: 'in_progress',
        tags: ['Health', 'Personal'],
        dueDate: '2026-01-30',
        subtasks: [],
        notes: []
      },
      {
        id: 't9',
        title: 'Meal prep every Sunday',
        status: 'in_progress',
        tags: ['Health', 'Planning'],
        dueDate: null,
        subtasks: [],
        notes: []
      }
    ]
  },
  {
    id: '3',
    title: 'Holiday Season 2025',
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    createdAt: '2025-11-15T10:00:00Z',
    standaloneNotes: [
      { id: 'sn3', content: 'Great holiday season! Everyone loved their gifts.', date: '2025-12-26', createdAt: '2025-12-26T10:00:00Z' }
    ],
    tasks: [
      {
        id: 't10',
        title: 'Buy gifts for family',
        status: 'complete',
        tags: ['Personal', 'Planning'],
        dueDate: '2025-12-20',
        subtasks: [
          { id: 't10-1', title: 'Mom - cashmere scarf', status: 'complete' },
          { id: 't10-2', title: 'Dad - whiskey set', status: 'complete' },
          { id: 't10-3', title: 'Sister - book collection', status: 'complete' }
        ],
        notes: []
      },
      {
        id: 't11',
        title: 'Decorate the apartment',
        status: 'complete',
        tags: ['Personal'],
        dueDate: '2025-12-10',
        subtasks: [],
        notes: []
      },
      {
        id: 't12',
        title: 'Plan New Years Eve party',
        status: 'complete',
        tags: ['Personal', 'Planning'],
        dueDate: '2025-12-28',
        subtasks: [
          { id: 't12-1', title: 'Send invites', status: 'complete' },
          { id: 't12-2', title: 'Buy champagne', status: 'complete' },
          { id: 't12-3', title: 'Create playlist', status: 'complete' }
        ],
        notes: []
      }
    ]
  },
  {
    id: '4',
    title: 'Learn Piano',
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    createdAt: '2026-01-10T10:00:00Z',
    standaloneNotes: [],
    tasks: [
      {
        id: 't13',
        title: 'Find a piano teacher',
        status: 'not_started',
        tags: ['Learning'],
        dueDate: '2026-02-15',
        subtasks: [],
        notes: []
      },
      {
        id: 't14',
        title: 'Practice scales daily',
        status: 'not_started',
        tags: ['Learning', 'Personal'],
        dueDate: null,
        subtasks: [],
        notes: []
      },
      {
        id: 't15',
        title: 'Learn 3 complete songs',
        status: 'not_started',
        tags: ['Learning'],
        dueDate: '2026-06-15',
        subtasks: [
          { id: 't15-1', title: 'Fur Elise - Beethoven', status: 'not_started' },
          { id: 't15-2', title: 'Clair de Lune - Debussy', status: 'not_started' },
          { id: 't15-3', title: 'River Flows in You - Yiruma', status: 'not_started' }
        ],
        notes: []
      }
    ]
  }
];

// Set the data in localStorage
localStorage.setItem('framed-milestones', JSON.stringify(sampleMilestones));

// Set default view to dashboard
localStorage.setItem('framed-lastView', JSON.stringify({ view: 'dashboard' }));

console.log('Sample data loaded! Refresh the page to see the changes.');
console.log('Milestones created:');
console.log('- Japan Trip 2026 (active)');
console.log('- Q1 Fitness Goals (active)');
console.log('- Holiday Season 2025 (complete)');
console.log('- Learn Piano (upcoming)');

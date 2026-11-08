import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Vercel serverless functions, root filesystem is read-only except /tmp
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'quick-note-data')
  : path.resolve(__dirname, '../../data');

const DB_FILE = path.join(DATA_DIR, 'notes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic seed notes
const getSeedNotes = () => [
  {
    id: 'note_seed_001',
    title: 'Workora Project Submission Checklist',
    content: '1. Build REST API (GET, POST, DELETE)\n2. Implement asynchronous fetch() calls\n3. Verify responsive layout\n4. Push clean commit to GitHub & deploy on Vercel.',
    category: 'Work',
    color: 'yellow',
    isPinned: true,
    tags: ['workora', 'project', 'submission', 'checklist'],
    createdAt: '2026-11-08T09:00:00.000Z',
    updatedAt: '2026-11-08T09:00:00.000Z',
  },
  {
    id: 'note_seed_002',
    title: 'RESTful API Architecture Best Practices',
    content: 'Always use proper HTTP verbs: GET for retrieval, POST for creation, PUT/PATCH for mutation, and DELETE for removal. Return descriptive JSON status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found.',
    category: 'Study',
    color: 'blue',
    isPinned: true,
    tags: ['rest', 'api', 'architecture', 'http'],
    createdAt: '2026-11-08T08:30:00.000Z',
    updatedAt: '2026-11-08T08:30:00.000Z',
  },
  {
    id: 'note_seed_003',
    title: 'Agricultural IoT Telemetry Idea',
    content: 'Deploy solar-powered RS485 soil moisture and NPK sensor probes communicating via LoRaWAN to cloud backend. Push daily soil prescriptions via automated WhatsApp notifications.',
    category: 'Ideas',
    color: 'green',
    isPinned: false,
    tags: ['agriculture', 'iot', 'sensors', 'lorawan'],
    createdAt: '2026-11-07T14:15:00.000Z',
    updatedAt: '2026-11-07T14:15:00.000Z',
  },
  {
    id: 'note_seed_004',
    title: 'Weekly Personal Goals & Errands',
    content: '- Review algorithms and data structures\n- 45-minute daily cardio / gym session\n- Pick up organic groceries\n- Clean workspace desk and organize cables.',
    category: 'Personal',
    color: 'purple',
    isPinned: false,
    tags: ['goals', 'personal', 'habits'],
    createdAt: '2026-11-07T10:00:00.000Z',
    updatedAt: '2026-11-07T10:00:00.000Z',
  },
  {
    id: 'note_seed_005',
    title: 'Urgent: Server Health & SSL Expiry Check',
    content: 'Review LetsEncrypt SSL certificate auto-renewals on reverse proxy. Check memory footprint and PM2 cluster restart logs.',
    category: 'Urgent',
    color: 'rose',
    isPinned: false,
    tags: ['urgent', 'ssl', 'devops', 'server'],
    createdAt: '2026-11-06T16:20:00.000Z',
    updatedAt: '2026-11-06T16:20:00.000Z',
  },
  {
    id: 'note_seed_006',
    title: 'JavaScript Async/Await & Fetch Notes',
    content: 'Using async/await with window.fetch() allows writing asynchronous code synchronously. Always wrap fetch in try/catch to capture network failures, and check response.ok before parsing JSON.',
    category: 'Study',
    color: 'slate',
    isPinned: false,
    tags: ['javascript', 'async', 'fetch', 'es6'],
    createdAt: '2026-11-06T11:45:00.000Z',
    updatedAt: '2026-11-06T11:45:00.000Z',
  },
];

/**
 * Reads notes from local JSON store. Initializes with seed data if file is missing.
 */
export const readNotes = async () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const seeds = getSeedNotes();
      fs.writeFileSync(DB_FILE, JSON.stringify(seeds, null, 2), 'utf-8');
      return seeds;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading notes database:', err);
    return [];
  }
};

/**
 * Writes notes array to local JSON store atomically.
 */
export const writeNotes = async (notes) => {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(notes, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing notes database:', err);
    throw err;
  }
};

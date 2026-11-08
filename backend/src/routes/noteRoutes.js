import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  togglePinNote,
  deleteNote,
} from '../controllers/noteController.js';

const router = Router();

// RESTful Notes Endpoints
router.get('/notes', getNotes);
router.get('/notes/:id', getNoteById);
router.post('/notes', createNote);
router.put('/notes/:id', updateNote);
router.patch('/notes/:id/pin', togglePinNote);
router.delete('/notes/:id', deleteNote);

export default router;

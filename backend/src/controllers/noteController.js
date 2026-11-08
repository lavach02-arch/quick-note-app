import { readNotes, writeNotes } from '../utils/storage.js';

// Valid categories and pastel color palettes
export const CATEGORIES = ['All', 'Work', 'Personal', 'Ideas', 'Study', 'Urgent'];
export const COLORS = ['yellow', 'blue', 'green', 'purple', 'rose', 'slate'];

/**
 * Generates unique note ID
 */
const generateId = () => {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

/**
 * GET /api/notes
 * Retrieves all notes with optional search, category filter, and pin-first sorting
 */
export const getNotes = async (req, res) => {
  try {
    const { search = '', category = 'all', isPinned, sort = 'newest' } = req.query;
    const notes = await readNotes();

    const searchTerm = String(search).trim().toLowerCase();
    const activeCategory = String(category).trim().toLowerCase();

    // 1. Filter
    let filtered = notes.filter((note) => {
      // Search match
      if (searchTerm) {
        const titleMatch = note.title?.toLowerCase().includes(searchTerm);
        const contentMatch = note.content?.toLowerCase().includes(searchTerm);
        const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(searchTerm));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      // Category match
      if (activeCategory && activeCategory !== 'all') {
        if (note.category?.toLowerCase() !== activeCategory) return false;
      }

      // Pin filter
      if (isPinned !== undefined) {
        const pinBool = isPinned === 'true';
        if (Boolean(note.isPinned) !== pinBool) return false;
      }

      return true;
    });

    // 2. Sort: Pinned notes always come first, then sorted by requested order
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Default: newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 3. Category count aggregations for sidebar chips
    const categoryStats = CATEGORIES.reduce((acc, cat) => {
      if (cat === 'All') {
        acc[cat] = notes.length;
      } else {
        acc[cat] = notes.filter((n) => n.category?.toLowerCase() === cat.toLowerCase()).length;
      }
      return acc;
    }, {});

    const pinnedCount = notes.filter((n) => n.isPinned).length;

    return res.status(200).json({
      success: true,
      count: filtered.length,
      total: notes.length,
      pinnedCount,
      categoryStats,
      data: filtered,
    });
  } catch (err) {
    console.error('Error fetching notes:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notes from database.',
      error: err.message,
    });
  }
};

/**
 * GET /api/notes/:id
 * Retrieves a single note by ID
 */
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await readNotes();
    const note = notes.find((n) => n.id === id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (err) {
    console.error('Error fetching note by ID:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch note details.',
      error: err.message,
    });
  }
};

/**
 * POST /api/notes
 * Creates a new note
 */
export const createNote = async (req, res) => {
  try {
    const { title, content, category = 'General', color = 'yellow', isPinned = false, tags = [] } = req.body;

    // Validation
    if (!title || String(title).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note title is required and cannot be empty.',
      });
    }

    if (!content || String(content).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required.',
      });
    }

    const now = new Date().toISOString();
    const newNote = {
      id: generateId(),
      title: String(title).trim(),
      content: String(content).trim(),
      category: String(category).trim() || 'General',
      color: COLORS.includes(color) ? color : 'yellow',
      isPinned: Boolean(isPinned),
      tags: Array.isArray(tags)
        ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
        : [],
      createdAt: now,
      updatedAt: now,
    };

    const notes = await readNotes();
    notes.unshift(newNote); // Prepend so new note is at top
    await writeNotes(notes);

    return res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      data: newNote,
    });
  } catch (err) {
    console.error('Error creating note:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save note to database.',
      error: err.message,
    });
  }
};

/**
 * PUT /api/notes/:id
 * Updates an existing note
 */
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, color, isPinned, tags } = req.body;

    const notes = await readNotes();
    const index = notes.findIndex((n) => n.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Note with ID '${id}' was not found.`,
      });
    }

    const existing = notes[index];
    const updatedNote = {
      ...existing,
      title: title !== undefined ? String(title).trim() : existing.title,
      content: content !== undefined ? String(content).trim() : existing.content,
      category: category !== undefined ? String(category).trim() : existing.category,
      color: color && COLORS.includes(color) ? color : existing.color,
      isPinned: isPinned !== undefined ? Boolean(isPinned) : existing.isPinned,
      tags: tags !== undefined
        ? (Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : existing.tags)
        : existing.tags,
      updatedAt: new Date().toISOString(),
    };

    // Validation
    if (!updatedNote.title) {
      return res.status(400).json({
        success: false,
        message: 'Note title cannot be empty.',
      });
    }

    notes[index] = updatedNote;
    await writeNotes(notes);

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      data: updatedNote,
    });
  } catch (err) {
    console.error('Error updating note:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update note.',
      error: err.message,
    });
  }
};

/**
 * PATCH /api/notes/:id/pin
 * Toggles pinned status for a note
 */
export const togglePinNote = async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await readNotes();
    const index = notes.findIndex((n) => n.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Note with ID '${id}' was not found.`,
      });
    }

    notes[index].isPinned = !notes[index].isPinned;
    notes[index].updatedAt = new Date().toISOString();
    await writeNotes(notes);

    return res.status(200).json({
      success: true,
      message: `Note ${notes[index].isPinned ? 'pinned to top' : 'unpinned'}.`,
      data: notes[index],
    });
  } catch (err) {
    console.error('Error toggling pin:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle pin status.',
      error: err.message,
    });
  }
};

/**
 * DELETE /api/notes/:id
 * Deletes a note by ID
 */
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await readNotes();
    const index = notes.findIndex((n) => n.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Note with ID '${id}' was not found.`,
      });
    }

    const [deleted] = notes.splice(index, 1);
    await writeNotes(notes);

    return res.status(200).json({
      success: true,
      message: `Note '${deleted.title}' deleted successfully.`,
      data: deleted,
    });
  } catch (err) {
    console.error('Error deleting note:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete note from database.',
      error: err.message,
    });
  }
};

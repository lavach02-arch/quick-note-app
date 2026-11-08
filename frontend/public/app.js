/**
 * Quick Note Application - Frontend Client Architecture
 * Implements asynchronous CRUD using native window.fetch()
 */

// Application State
const state = {
  notes: [],
  categoryStats: {},
  activeCategory: 'All',
  searchTerm: '',
  filterPinnedOnly: false,
  selectedCreateColor: 'yellow',
  isLoading: false,
};

const CATEGORIES = ['All', 'Work', 'Personal', 'Ideas', 'Study', 'Urgent'];

// DOM Elements
const elements = {
  createForm: document.getElementById('create-note-form'),
  inputTitle: document.getElementById('input-title'),
  inputContent: document.getElementById('input-content'),
  selectCategory: document.getElementById('select-category'),
  inputTags: document.getElementById('input-tags'),
  checkPinned: document.getElementById('check-pinned'),
  colorPicker: document.getElementById('color-picker'),
  btnSubmitNote: document.getElementById('btn-submit-note'),

  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  categoryPillsContainer: document.getElementById('category-pills'),
  filterPinnedOnly: document.getElementById('filter-pinned-only'),
  btnRefresh: document.getElementById('btn-refresh'),

  pinnedSection: document.getElementById('pinned-section'),
  pinnedGrid: document.getElementById('pinned-grid'),
  pinnedCountBadge: document.getElementById('pinned-count-badge'),

  notesGrid: document.getElementById('notes-grid'),
  notesCountBadge: document.getElementById('notes-count-badge'),
  allNotesHeading: document.getElementById('all-notes-heading'),
  emptyState: document.getElementById('empty-state'),

  statTotal: document.getElementById('stat-total'),
  statPinned: document.getElementById('stat-pinned'),

  editModal: document.getElementById('edit-modal'),
  editForm: document.getElementById('edit-note-form'),
  editNoteId: document.getElementById('edit-note-id'),
  editTitle: document.getElementById('edit-title'),
  editContent: document.getElementById('edit-content'),
  editCategory: document.getElementById('edit-category'),
  editColor: document.getElementById('edit-color'),
  editPinned: document.getElementById('edit-pinned'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  editCancelBtn: document.getElementById('edit-cancel-btn'),

  toastContainer: document.getElementById('toast-container'),
};

/**
 * ----------------------------------------------------
 * API ASYNCHRONOUS OPERATIONS (FETCH)
 * ----------------------------------------------------
 */

/**
 * GET /api/notes
 * Fetches notes from backend using native fetch()
 */
async function fetchNotes() {
  state.isLoading = true;
  try {
    const params = new URLSearchParams();
    if (state.searchTerm) params.append('search', state.searchTerm);
    if (state.activeCategory && state.activeCategory !== 'All') {
      params.append('category', state.activeCategory);
    }
    if (state.filterPinnedOnly) {
      params.append('isPinned', 'true');
    }

    const response = await fetch(`/api/notes?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      state.notes = result.data || [];
      state.categoryStats = result.categoryStats || {};

      // Update counters
      elements.statTotal.textContent = result.total || 0;
      elements.statPinned.textContent = result.pinnedCount || 0;

      renderCategoryPills();
      renderNotes();
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Failed to load notes. Please verify backend is running.', 'error');
  } finally {
    state.isLoading = false;
  }
}

/**
 * POST /api/notes
 * Creates a new note asynchronously
 */
async function createNote(noteData) {
  try {
    elements.btnSubmitNote.disabled = true;
    elements.btnSubmitNote.classList.add('opacity-70');

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to create note');
    }

    showToast(`Note "${result.data.title}" created successfully!`, 'success');

    // Reset creation form
    elements.createForm.reset();
    setColorSelection('yellow');
    elements.checkPinned.checked = false;

    // Refresh notes
    await fetchNotes();
  } catch (error) {
    console.error('Create note error:', error);
    showToast(error.message, 'error');
  } finally {
    elements.btnSubmitNote.disabled = false;
    elements.btnSubmitNote.classList.remove('opacity-70');
  }
}

/**
 * PUT /api/notes/:id
 * Updates an existing note asynchronously
 */
async function updateNote(id, updatedData) {
  try {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update note');
    }

    showToast(`Note updated successfully.`, 'success');
    closeEditModal();
    await fetchNotes();
  } catch (error) {
    console.error('Update note error:', error);
    showToast(error.message, 'error');
  }
}

/**
 * PATCH /api/notes/:id/pin
 * Toggles pin state asynchronously
 */
async function togglePin(id) {
  try {
    const response = await fetch(`/api/notes/${id}/pin`, {
      method: 'PATCH',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to toggle pin');
    }

    showToast(result.message, 'info');
    await fetchNotes();
  } catch (error) {
    console.error('Pin toggle error:', error);
    showToast(error.message, 'error');
  }
}

/**
 * DELETE /api/notes/:id
 * Deletes a note asynchronously
 */
async function deleteNote(id, title) {
  if (!confirm(`Are you sure you want to delete note "${title}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete note');
    }

    showToast(`Note "${title}" deleted.`, 'success');
    await fetchNotes();
  } catch (error) {
    console.error('Delete error:', error);
    showToast(error.message, 'error');
  }
}

/**
 * ----------------------------------------------------
 * DOM RENDERING
 * ----------------------------------------------------
 */

/**
 * Renders category filter pills with live count badges
 */
function renderCategoryPills() {
  elements.categoryPillsContainer.innerHTML = '';

  CATEGORIES.forEach((cat) => {
    const isSelected = state.activeCategory === cat;
    const count = state.categoryStats[cat] || 0;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
      isSelected
        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
    }`;

    btn.innerHTML = `
      <span>${cat}</span>
      <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
        isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
      }">${count}</span>
    `;

    btn.addEventListener('click', () => {
      state.activeCategory = cat;
      fetchNotes();
    });

    elements.categoryPillsContainer.appendChild(btn);
  });
}

/**
 * Creates note card HTML DOM element
 */
function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = `note-${note.color || 'yellow'} rounded-3xl p-5 border shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-3 relative group animate-note-enter`;

  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Escape HTML to prevent XSS
  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  };

  const safeTitle = escapeHtml(note.title);
  const safeContent = escapeHtml(note.content).replace(/\n/g, '<br/>');

  card.innerHTML = `
    <!-- Top Action Bar -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 text-slate-800 border border-black/5">
          ${escapeHtml(note.category || 'General')}
        </span>
        ${
          note.isPinned
            ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300">
                <i data-lucide="pin" class="w-3 h-3 fill-current"></i> Pinned
               </span>`
            : ''
        }
      </div>

      <!-- Card Action Buttons -->
      <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <button class="btn-pin p-1.5 rounded-lg hover:bg-black/10 text-slate-700 transition-colors" title="${note.isPinned ? 'Unpin note' : 'Pin to top'}">
          <i data-lucide="pin" class="w-4 h-4 ${note.isPinned ? 'fill-current text-amber-800' : ''}"></i>
        </button>
        <button class="btn-edit p-1.5 rounded-lg hover:bg-black/10 text-slate-700 transition-colors" title="Edit note">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button class="btn-delete p-1.5 rounded-lg hover:bg-red-500 hover:text-white text-slate-700 transition-colors" title="Delete note">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>

    <!-- Note Body -->
    <div class="space-y-1.5 flex-1">
      <h3 class="font-extrabold text-base text-slate-900 tracking-tight leading-snug">
        ${safeTitle}
      </h3>
      <div class="text-xs text-slate-700 leading-relaxed break-words line-clamp-6">
        ${safeContent}
      </div>
    </div>

    <!-- Note Footer (Tags & Timestamp) -->
    <div class="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
      <div class="flex flex-wrap gap-1">
        ${(note.tags || [])
          .slice(0, 3)
          .map((t) => `<span class="px-1.5 py-0.2 bg-black/5 rounded text-[10px]">#${escapeHtml(t)}</span>`)
          .join('')}
      </div>
      <span title="Created: ${new Date(note.createdAt).toLocaleString()}">${formattedDate}</span>
    </div>
  `;

  // Attach event handlers
  card.querySelector('.btn-pin').addEventListener('click', () => togglePin(note.id));
  card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(note));
  card.querySelector('.btn-delete').addEventListener('click', () => deleteNote(note.id, note.title));

  return card;
}

/**
 * Renders notes into Pinned and Other sections
 */
function renderNotes() {
  const pinnedNotes = state.notes.filter((n) => n.isPinned);
  const otherNotes = state.notes.filter((n) => !n.isPinned);

  // 1. Pinned Section
  if (pinnedNotes.length > 0 && !state.filterPinnedOnly) {
    elements.pinnedSection.classList.remove('hidden');
    elements.pinnedCountBadge.textContent = pinnedNotes.length;
    elements.pinnedGrid.innerHTML = '';
    pinnedNotes.forEach((note) => {
      elements.pinnedGrid.appendChild(createNoteCard(note));
    });
    elements.allNotesHeading.textContent = 'Other Notes';
  } else {
    elements.pinnedSection.classList.add('hidden');
    elements.allNotesHeading.textContent = state.filterPinnedOnly ? 'Pinned Notes' : 'All Notes';
  }

  // 2. Main Grid
  elements.notesGrid.innerHTML = '';
  const displayNotes = state.filterPinnedOnly ? pinnedNotes : otherNotes;
  elements.notesCountBadge.textContent = displayNotes.length;

  if (state.notes.length === 0) {
    elements.emptyState.classList.remove('hidden');
  } else {
    elements.emptyState.classList.add('hidden');
    displayNotes.forEach((note) => {
      elements.notesGrid.appendChild(createNoteCard(note));
    });
  }

  // Re-initialize Lucide icons on newly created elements
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Sets color selection in note creation form
 */
function setColorSelection(colorName) {
  state.selectedCreateColor = colorName;
  const swatches = elements.colorPicker.querySelectorAll('.color-swatch');
  swatches.forEach((btn) => {
    if (btn.dataset.color === colorName) {
      btn.classList.add('active', 'ring-2', 'ring-amber-400');
    } else {
      btn.classList.remove('active', 'ring-2', 'ring-amber-400');
    }
  });
}

/**
 * Opens edit modal with note values
 */
function openEditModal(note) {
  elements.editNoteId.value = note.id;
  elements.editTitle.value = note.title;
  elements.editContent.value = note.content;
  elements.editCategory.value = note.category || 'General';
  elements.editColor.value = note.color || 'yellow';
  elements.editPinned.checked = Boolean(note.isPinned);

  elements.editModal.classList.remove('hidden');
}

/**
 * Closes edit modal
 */
function closeEditModal() {
  elements.editModal.classList.add('hidden');
  elements.editForm.reset();
}

/**
 * Displays floating toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60',
    error: 'bg-rose-900/90 text-rose-100 border-rose-700/60',
    info: 'bg-slate-900/90 text-slate-100 border-slate-700/60',
  };

  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info',
  };

  toast.className = `${bgColors[type]} backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 font-sans`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * ----------------------------------------------------
 * EVENT LISTENERS SETUP
 * ----------------------------------------------------
 */
function setupEventListeners() {
  // Create Note Form Submission
  elements.createForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = elements.inputTitle.value.trim();
    const content = elements.inputContent.value.trim();
    const category = elements.selectCategory.value;
    const isPinned = elements.checkPinned.checked;
    const tags = elements.inputTags.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!title || !content) {
      showToast('Title and content are required.', 'error');
      return;
    }

    createNote({
      title,
      content,
      category,
      color: state.selectedCreateColor,
      isPinned,
      tags,
    });
  });

  // Color Swatch Selection
  elements.colorPicker.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (swatch) {
      setColorSelection(swatch.dataset.color);
    }
  });

  // Search Input with Debounce
  let searchDebounceTimer;
  elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    elements.searchClearBtn.classList.toggle('hidden', val === '');

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.searchTerm = val;
      fetchNotes();
    }, 300);
  });

  // Clear Search Button
  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.classList.add('hidden');
    state.searchTerm = '';
    fetchNotes();
  });

  // Pinned Only Toggle
  elements.filterPinnedOnly.addEventListener('change', (e) => {
    state.filterPinnedOnly = e.target.checked;
    fetchNotes();
  });

  // Refresh Button
  elements.btnRefresh.addEventListener('click', () => {
    fetchNotes();
    showToast('Notes refreshed from server.', 'info');
  });

  // Edit Modal Submission
  elements.editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = elements.editNoteId.value;
    const title = elements.editTitle.value.trim();
    const content = elements.editContent.value.trim();
    const category = elements.editCategory.value;
    const color = elements.editColor.value;
    const isPinned = elements.editPinned.checked;

    updateNote(id, { title, content, category, color, isPinned });
  });

  // Modal Close Handlers
  elements.modalCloseBtn.addEventListener('click', closeEditModal);
  elements.editCancelBtn.addEventListener('click', closeEditModal);
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) closeEditModal();
  });
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchNotes();
  if (window.lucide) window.lucide.createIcons();
});

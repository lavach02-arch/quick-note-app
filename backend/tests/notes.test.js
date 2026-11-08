import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;
let createdNoteId;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
});

test('QUICK NOTE REST API SUITE', async (t) => {
  await t.test('1. GET /api/health - Service health check', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(json.message.includes('Quick Note'));
  });

  await t.test('2. GET /api/notes - Should return list of notes and category statistics', async () => {
    const res = await fetch(`${baseUrl}/api/notes`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.total >= 1);
    assert.ok(json.categoryStats);
  });

  await t.test('3. POST /api/notes - Should successfully create a new note', async () => {
    const newNotePayload = {
      title: 'Automated Test Note',
      content: 'This note was created automatically by node:test runner.',
      category: 'Work',
      color: 'blue',
      isPinned: true,
      tags: ['test', 'automated', 'jest-runner'],
    };

    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotePayload),
    });
    const json = await res.json();

    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    assert.equal(json.data.title, newNotePayload.title);
    assert.equal(json.data.category, 'Work');
    assert.equal(json.data.color, 'blue');
    assert.equal(json.data.isPinned, true);

    createdNoteId = json.data.id;
  });

  await t.test('4. POST /api/notes - Should reject note with empty title (400)', async () => {
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: 'Some content' }),
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.ok(json.message.includes('title is required'));
  });

  await t.test('5. POST /api/notes - Should reject note with empty content (400)', async () => {
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Valid Title', content: '' }),
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.ok(json.message.includes('content is required'));
  });

  await t.test('6. GET /api/notes/:id - Should retrieve newly created note', async () => {
    assert.ok(createdNoteId, 'Note ID must exist from previous test');
    const res = await fetch(`${baseUrl}/api/notes/${createdNoteId}`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.data.id, createdNoteId);
    assert.equal(json.data.title, 'Automated Test Note');
  });

  await t.test('7. GET /api/notes/:id - Should return 404 for invalid ID', async () => {
    const res = await fetch(`${baseUrl}/api/notes/non_existent_note_999`);
    const json = await res.json();
    assert.equal(res.status, 404);
    assert.equal(json.success, false);
  });

  await t.test('8. PUT /api/notes/:id - Should update note title and content', async () => {
    const res = await fetch(`${baseUrl}/api/notes/${createdNoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Note Title',
        content: 'Updated note content successfully verified.',
        color: 'rose',
      }),
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.data.title, 'Updated Note Title');
    assert.equal(json.data.color, 'rose');
  });

  await t.test('9. PATCH /api/notes/:id/pin - Should toggle pinned status', async () => {
    const res = await fetch(`${baseUrl}/api/notes/${createdNoteId}/pin`, {
      method: 'PATCH',
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.data.isPinned, false); // Toggled from true to false
  });

  await t.test('10. GET /api/notes?search=... - Should filter notes by search term', async () => {
    const res = await fetch(`${baseUrl}/api/notes?search=Updated`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.ok(json.data.some((n) => n.id === createdNoteId));
  });

  await t.test('11. GET /api/notes?category=Work - Should filter by category', async () => {
    const res = await fetch(`${baseUrl}/api/notes?category=Work`);
    const json = await res.json();
    assert.equal(res.status, 200);
    json.data.forEach((note) => {
      assert.equal(note.category.toLowerCase(), 'work');
    });
  });

  await t.test('12. DELETE /api/notes/:id - Should delete note by ID', async () => {
    const res = await fetch(`${baseUrl}/api/notes/${createdNoteId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.id, createdNoteId);
  });

  await t.test('13. GET /api/notes/:id - Should return 404 after deletion', async () => {
    const res = await fetch(`${baseUrl}/api/notes/${createdNoteId}`);
    assert.equal(res.status, 404);
  });
});

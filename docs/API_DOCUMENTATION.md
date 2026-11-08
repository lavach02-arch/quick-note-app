# Quick Note Application - REST API Documentation

Base URL: `http://localhost:5001/api`

---

## 1. Retrieve All Notes

### `GET /api/notes`

Fetches all notes matching optional search criteria, category filters, and pin status. Pinned notes automatically appear first.

#### Query Parameters
- `search` (optional): Case-insensitive string search against `title`, `content`, or `tags`.
- `category` (optional): Category filter: `'Work'`, `'Personal'`, `'Ideas'`, `'Study'`, `'Urgent'`, or `'All'` (default).
- `isPinned` (optional): `'true'` or `'false'`.
- `sort` (optional): `'newest'` (default), `'oldest'`, or `'title'`.

#### Example Request
```http
GET /api/notes?category=Work&search=checklist HTTP/1.1
Host: localhost:5001
```

#### Example Response (200 OK)
```json
{
  "success": true,
  "count": 1,
  "total": 6,
  "pinnedCount": 2,
  "categoryStats": {
    "All": 6,
    "Work": 1,
    "Personal": 1,
    "Ideas": 1,
    "Study": 2,
    "Urgent": 1
  },
  "data": [
    {
      "id": "note_seed_001",
      "title": "Workora Project Submission Checklist",
      "content": "1. Build REST API (GET, POST, DELETE)\n2. Implement asynchronous fetch() calls\n3. Verify responsive layout\n4. Push clean commit to GitHub & deploy on Vercel.",
      "category": "Work",
      "color": "yellow",
      "isPinned": true,
      "tags": ["workora", "project", "submission", "checklist"],
      "createdAt": "2026-11-08T09:00:00.000Z",
      "updatedAt": "2026-11-08T09:00:00.000Z"
    }
  ]
}
```

---

## 2. Retrieve Single Note

### `GET /api/notes/:id`

Retrieves a single note by its unique identifier.

- **Status 200 OK**: Returns matching note object.
- **Status 404 Not Found**: If note does not exist.

---

## 3. Create Note

### `POST /api/notes`

Creates a new note and persists it to the JSON store.

#### Request Body (JSON)
```json
{
  "title": "New Meeting Notes",
  "content": "Discussed system scalability and database index strategies.",
  "category": "Work",
  "color": "blue",
  "isPinned": false,
  "tags": ["meeting", "scalability"]
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Note created successfully.",
  "data": {
    "id": "note_1794078500000_a1b2c",
    "title": "New Meeting Notes",
    "content": "Discussed system scalability and database index strategies.",
    "category": "Work",
    "color": "blue",
    "isPinned": false,
    "tags": ["meeting", "scalability"],
    "createdAt": "2026-11-08T10:15:00.000Z",
    "updatedAt": "2026-11-08T10:15:00.000Z"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Note title is required and cannot be empty."
}
```

---

## 4. Update Note

### `PUT /api/notes/:id`

Updates fields of an existing note.

#### Request Body (JSON)
```json
{
  "title": "Updated Meeting Notes",
  "content": "Action items assigned to team leads.",
  "color": "green",
  "isPinned": true
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Note updated successfully.",
  "data": { ... }
}
```

---

## 5. Toggle Pin Status

### `PATCH /api/notes/:id/pin`

Toggles the `isPinned` boolean of a note.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Note pinned to top.",
  "data": { ... }
}
```

---

## 6. Delete Note

### `DELETE /api/notes/:id`

Deletes a note by its ID from the persistent store.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Note 'New Meeting Notes' deleted successfully.",
  "data": {
    "id": "note_1794078500000_a1b2c",
    "title": "New Meeting Notes"
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Note with ID 'invalid_id' was not found."
}
```

---

## 7. Service Healthcheck

### `GET /api/health`

Reports service status and active endpoint definitions.

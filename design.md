# Design Document – Patient Document Portal

## 1. Tech Stack Choices

### Q1. Frontend framework and why?

**Chosen:** React

- Component-based: easy to split UI into upload form, list view, etc.
- Huge ecosystem and community support.
- Very common in modern full-stack jobs, so it matches real-world usage.

### Q2. Backend framework and why?

**Chosen:** Node.js + Express

- Simple and lightweight for building REST APIs.
- Same language (JavaScript) for frontend and backend.
- Rich middleware ecosystem (e.g. `multer` for file uploads).

### Q3. Database choice and why?

**Chosen:** SQLite

- File-based DB, no separate server required.
- Perfect for a small local assignment (single user, low traffic).
- SQL-based, so migrating to PostgreSQL/MySQL later is easy.

Schema (table `documents`):

- `id` (INTEGER, primary key, auto-increment)
- `filename` (TEXT)
- `filepath` (TEXT)
- `filesize` (INTEGER)
- `created_at` (TEXT – ISO string)

### Q4. If supporting ~1,000 users – what changes?

- Move file storage from local `uploads/` folder to cloud storage (like S3).
- Migrate DB from SQLite to PostgreSQL/MySQL for better concurrency.
- Add `user_id` column in the `documents` table and proper authentication.
- Add indexes on frequently used columns (e.g. `user_id`, `created_at`).
- Add pagination, search & filters in the frontend.
- Introduce rate limiting, validation, and possibly deploy behind a reverse proxy (Nginx).

---

## 2. Architecture Overview

**Flow:**

1. **Frontend (React)**  
   - Shows upload form  
   - Lists documents  
   - Buttons for download & delete  

2. **Backend (Express API)**  
   - Endpoints:  
     - `POST /documents/upload` – upload PDF  
     - `GET /documents` – list PDFs  
     - `GET /documents/:id` – download PDF  
     - `DELETE /documents/:id` – delete PDF  

3. **Database (SQLite)**  
   - Stores metadata in `documents` table.

4. **File storage (local)**  
   - Actual files stored in `backend/uploads/`.

Text diagram:

- Browser (React)
  → HTTP → Express API
  → SQLite (metadata) + `uploads/` folder (files)

---

## 3. API Specification

### 1) `POST /documents/upload`

- **Method:** POST  
- **URL:** `/documents/upload`  
- **Description:** Upload a PDF file.  
- **Request:** `multipart/form-data` with field `file` (PDF only).  
- **Success (201):**
  ```json
  {
    "id": 1,
    "filename": "report.pdf",
    "filesize": 123456,
    "created_at": "2025-12-09T10:20:00.000Z",
    "message": "File uploaded successfully"
  }

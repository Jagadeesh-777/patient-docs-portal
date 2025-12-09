// backend/app.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

function pdfFileFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// POST /documents/upload
app.post('/documents/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: 'No file uploaded or invalid file type' });
  }

  const { originalname, filename, size } = req.file;
  const filepath = path.join('uploads', filename);
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO documents (filename, filepath, filesize, created_at)
     VALUES (?, ?, ?, ?)`,
    [originalname, filepath, size, createdAt],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save metadata' });
      }

      res.status(201).json({
        id: this.lastID,
        filename: originalname,
        filesize: size,
        created_at: createdAt,
        message: 'File uploaded successfully'
      });
    }
  );
});

// GET /documents
app.get('/documents', (req, res) => {
  db.all(
    `SELECT id, filename, filesize, created_at
     FROM documents
     ORDER BY datetime(created_at) DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }
      res.json(rows);
    }
  );
});

// GET /documents/:id (download)
app.get('/documents/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM documents WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch document' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const absolutePath = path.join(__dirname, row.filepath);
    res.download(absolutePath, row.filename, (downloadErr) => {
      if (downloadErr) {
        console.error(downloadErr);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  });
});

// DELETE /documents/:id
app.delete('/documents/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM documents WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch document' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const absolutePath = path.join(__dirname, row.filepath);

    fs.unlink(absolutePath, (fsErr) => {
      if (fsErr && fsErr.code !== 'ENOENT') {
        console.error(fsErr);
        return res
          .status(500)
          .json({ error: 'Failed to delete file from disk' });
      }

      db.run(`DELETE FROM documents WHERE id = ?`, [id], function (dbErr) {
        if (dbErr) {
          console.error(dbErr);
          return res
            .status(500)
            .json({ error: 'Failed to delete from database' });
        }

        res.json({ message: 'Document deleted successfully' });
      });
    });
  });
});

// ✅ THIS PART WAS MISSING / WRONG EARLIER
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

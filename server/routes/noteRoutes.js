const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const noteController = require('../controllers/noteController');
const { requireAuth } = require('../services/supabaseAuth');

const ensureUploadDirs = () => {
  ['uploads', 'uploads/audio', 'uploads/documents'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') cb(null, 'uploads/audio/');
    else if (file.fieldname === 'document') cb(null, 'uploads/documents/');
    else cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.webm')) {
        return cb(null, true);
      }
      return cb(new Error('Only audio files are allowed for audio uploads'));
    }
    if (file.fieldname === 'document') {
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        return cb(null, true);
      }
      return cb(new Error('Only PDF files are allowed for document uploads'));
    }
    cb(null, true);
  }
});

// Standard 4-arg Express error middleware so multer errors get a JSON response
// instead of falling through to the default HTML handler.
const handleUploadErrors = (err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  return res.status(400).json({ error: err.message });
};

router.post('/', requireAuth, noteController.createNote);
router.get('/', requireAuth, noteController.getAllNotes);
router.get('/:id', requireAuth, noteController.getNote);
router.put('/:id', requireAuth, noteController.updateNote);
router.delete('/:id', requireAuth, noteController.deleteNote);

router.post(
  '/upload/audio',
  requireAuth,
  upload.single('audio'),
  handleUploadErrors,
  noteController.uploadAudio
);

router.post(
  '/upload/pdf',
  requireAuth,
  upload.single('document'),
  handleUploadErrors,
  noteController.uploadDocument
);

router.post('/upload/youtube', requireAuth, noteController.uploadYoutube);
router.get('/:id/youtube/status', requireAuth, noteController.getYoutubeStatus);
router.post('/:id/youtube/retry', requireAuth, noteController.retryYoutubeProcessing);

module.exports = router;

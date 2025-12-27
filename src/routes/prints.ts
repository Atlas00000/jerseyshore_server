import { Router } from 'express';
import multer from 'multer';
import { uploadPrint } from '../controllers/printController.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * POST /api/prints/upload
 * Upload a print image
 */
router.post('/upload', upload.single('image'), uploadPrint);

export default router;


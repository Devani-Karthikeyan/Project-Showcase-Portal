import express from 'express';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection
} from '../controllers/collectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCollections)
  .post(protect, createCollection);

router.route('/:id')
  .put(protect, updateCollection)
  .delete(protect, deleteCollection);

export default router;

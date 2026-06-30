import express from 'express';
import { getUniversities, getDegreePrograms } from '../controllers/metadataController.js';

const router = express.Router();

router.get('/universities', getUniversities);
router.get('/degree-programs', getDegreePrograms);

export default router;

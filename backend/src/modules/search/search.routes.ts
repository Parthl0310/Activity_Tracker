import { Router } from 'express';
import { SearchController } from './search.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const searchController = new SearchController();

router.use(authenticate);

router.post('/ask', searchController.queryAssistant);
router.get('/ask', searchController.queryAssistant);
router.get('/', searchController.semanticSearch);

export { router as searchRoutes };

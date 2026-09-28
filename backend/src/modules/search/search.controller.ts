import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service.js';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  public queryAssistant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const query = req.body?.query || req.query?.q || req.query?.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ status: 'error', message: 'Query is required and must be a string' });
        return;
      }

      const result = await this.searchService.queryAssistant(userId, query);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public semanticSearch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const query = (req.query.q as string) || (req.query.query as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ status: 'error', message: 'Search query parameter "q" is required' });
        return;
      }

      const results = await this.searchService.semanticSearch(userId, query, limit);

      res.status(200).json({
        status: 'success',
        data: {
          results,
          total: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

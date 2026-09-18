import { Router, Request, Response } from 'express';
import { generateExplanation } from '../llm/explain';

export const explainRouter = Router();

explainRouter.post('/', async (req: Request, res: Response): Promise<any> => {
    const { plan, lang } = req.body;
    if (!plan) return res.status(400).json({ error: 'Plan is required' });

    try {
        const result = await generateExplanation(plan, lang || 'ru');
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

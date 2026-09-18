import { Router, Request, Response } from 'express';
import { buildPlan } from '../engine';
import { supabase } from '../db/supabase';
import { Program } from '../../../../packages/shared/types';

export const planRouter = Router();

planRouter.post('/', async (req: Request, res: Response): Promise<any> => {
    const { answers, selected } = req.body;
    if (!answers) return res.status(400).json({ error: 'Answers payload is required' });
    
    const { data: programs, error } = await supabase.from('programs').select('*');
    if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to fetch programs' });
    }

    const plan = buildPlan(answers, programs as Program[]);
    res.json(plan);
});

import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

export const programsRouter = Router();

programsRouter.get('/', async (req: Request, res: Response): Promise<any> => {
    const { data: programs, error } = await supabase.from('programs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(programs);
});

import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { v4 as uuidv4 } from 'uuid';

export const profileRouter = Router();

profileRouter.post('/', async (req: Request, res: Response): Promise<any> => {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: 'Answers are required' });
    
    const id = uuidv4();
    const profile = {
        id, answers, selected_programs: [], favorites: [], progress: {}
    };

    const { error } = await supabase.from('profiles').insert([profile]);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ id });
});

profileRouter.get('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error || !profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
});

profileRouter.patch('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const partial = req.body;
    const { data: profile, error } = await supabase.from('profiles').update(partial).eq('id', id).select().single();
    if (error || !profile) return res.status(500).json({ error: error?.message || 'Update failed' });
    res.json(profile);
});

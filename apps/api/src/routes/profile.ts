import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { v4 as uuidv4 } from 'uuid';
import { mapProfileRow, toProfileRow } from '../db/mappers';

export const profileRouter = Router();

profileRouter.post('/', async (req: Request, res: Response): Promise<any> => {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: 'Answers are required' });

    const id = uuidv4();
    const row = toProfileRow({ id, answers, selectedPrograms: [], favorites: [], progress: {} });

    const { error } = await supabase.from('profiles').insert([row]);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ id });
});

profileRouter.get('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { data: row, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error || !row) return res.status(404).json({ error: 'Profile not found' });
    res.json(mapProfileRow(row));
});

profileRouter.patch('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    // req.body is a partial Profile in camelCase (the shared contract); Supabase needs the
    // snake_case column names the schema actually uses, or it errors on an unknown column.
    const row = toProfileRow(req.body);
    row.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase.from('profiles').update(row).eq('id', id).select().single();
    if (error || !updated) return res.status(500).json({ error: error?.message || 'Update failed' });
    res.json(mapProfileRow(updated));
});

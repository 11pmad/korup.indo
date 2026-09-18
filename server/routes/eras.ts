import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { asc } from 'drizzle-orm';

const router = Router();

// GET /api/eras
router.get('/', async (req, res) => {
  try {
    const eras = await db
      .select()
      .from(schema.presidentialEras)
      .orderBy(asc(schema.presidentialEras.start_date));

    res.json(eras);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

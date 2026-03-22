import { Hono } from 'hono';
import db from '../db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const admin = new Hono();

// --- Experiments ---

// GET /experiments
admin.get('/experiments', async (c) => {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM experiments ORDER BY createdAt DESC'
  );
  return c.json({ result: rows });
});

// GET /experiment/:id
admin.get('/experiment/:experimentId', async (c) => {
  const { experimentId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM experiments WHERE id = ?',
    [experimentId]
  );
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ result: rows[0] });
});

// POST /experiment
admin.post('/experiment', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await db.query(
    'INSERT INTO experiments (id, name, description, status) VALUES (?, ?, ?, ?)',
    [id, body.name, body.description || null, body.status || 'DRAFT']
  );

  return c.json({ result: { id }, created: true }, 201);
});

// PATCH /experiment/:id
admin.patch('/experiment/:experimentId', async (c) => {
  const { experimentId } = c.req.param();
  const body = await c.req.json();

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (['name', 'description', 'status', 'startDate', 'endDate'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return c.json({ error: 'No valid fields' }, 400);

  values.push(experimentId);
  await db.query(`UPDATE experiments SET ${fields.join(', ')} WHERE id = ?`, values);

  return c.json({ success: true });
});

// --- Treatments ---

// GET /experiment/:id/treatments
admin.get('/experiment/:experimentId/treatments', async (c) => {
  const { experimentId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM treatments WHERE experimentId = ? ORDER BY createdAt',
    [experimentId]
  );
  return c.json({ result: rows });
});

// POST /experiment/:id/treatments
admin.post('/experiment/:experimentId/treatments', async (c) => {
  const { experimentId } = c.req.param();
  const { treatments } = await c.req.json();

  if (!Array.isArray(treatments)) return c.json({ error: 'treatments must be array' }, 400);

  for (const t of treatments) {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO treatments (id, experimentId, name, demetricate, config) VALUES (?, ?, ?, ?, ?)',
      [id, experimentId, t.name, t.demetricate || false, JSON.stringify(t.config || {})]
    );
  }

  return c.json({ success: true, count: treatments.length });
});

// --- Participants ---

// GET /experiment/:id/participants
admin.get('/experiment/:experimentId/participants', async (c) => {
  const { experimentId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.*, t.name as treatmentName, t.demetricate 
     FROM participants p 
     LEFT JOIN treatments t ON p.treatmentId = t.id
     WHERE p.experimentId = ?
     ORDER BY p.createdAt`,
    [experimentId]
  );
  return c.json({ result: rows });
});

// POST /experiment/:id/participants (bulk create from CSV-like array)
admin.post('/experiment/:experimentId/participants', async (c) => {
  const { experimentId } = c.req.param();
  const { participants } = await c.req.json();

  if (!Array.isArray(participants)) return c.json({ error: 'participants must be array' }, 400);

  let created = 0;
  for (const p of participants) {
    const id = p.id || crypto.randomUUID();
    await db.query(
      'INSERT INTO participants (id, authcode, experimentId, treatmentId) VALUES (?, ?, ?, ?)',
      [id, p.authcode, experimentId, p.treatmentId]
    );
    created++;
  }

  return c.json({ success: true, count: created });
});

// GET /participant/:id
admin.get('/participant/:participantId', async (c) => {
  const { participantId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.*, t.name as treatmentName, t.demetricate, e.name as experimentName
     FROM participants p
     LEFT JOIN treatments t ON p.treatmentId = t.id
     LEFT JOIN experiments e ON p.experimentId = e.id
     WHERE p.id = ?`,
    [participantId]
  );
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ result: rows[0] });
});

// GET /participant/:id/participantLogs
admin.get('/participant/:participantId/participantLogs', async (c) => {
  const { participantId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM participant_logs WHERE participantId = ? ORDER BY createdAt DESC',
    [participantId]
  );
  return c.json({ result: rows });
});

export default admin;

import { Hono } from 'hono';
import db from '../db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const client = new Hono();

// POST /authenticate
client.post('/authenticate', async (c) => {
  const { authcode } = await c.req.json();
  if (!authcode) return c.json({ error: 'authcode required' }, 400);

  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id, status FROM participants WHERE authcode = ?',
    [authcode]
  );

  if (rows.length === 0) return c.json({ error: 'Invalid authcode' }, 401);

  const participant = rows[0];
  return c.json({ result: { participantId: participant.id } });
});

// GET /participant/:id
client.get('/participant/:participantId', async (c) => {
  const { participantId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM participants WHERE id = ?',
    [participantId]
  );
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ result: rows[0] });
});

// POST /participant/:id/setup
client.post('/participant/:participantId/setup', async (c) => {
  const { participantId } = c.req.param();
  const { deviceType } = await c.req.json();

  await db.query(
    'UPDATE participants SET deviceType = ?, status = ?, startTime = NOW() WHERE id = ?',
    [deviceType, 'ACTIVE', participantId]
  );

  return c.json({ success: true });
});

// PATCH /participant/:id
client.patch('/participant/:participantId', async (c) => {
  const { participantId } = c.req.param();
  const body = await c.req.json();

  const fields: string[] = [];
  const values: any[] = [];

  if (body.instagramHandle !== undefined) { fields.push('instagramHandle = ?'); values.push(body.instagramHandle); }
  if (body.instagramId !== undefined) { fields.push('instagramId = ?'); values.push(body.instagramId); }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400);

  values.push(participantId);
  await db.query(`UPDATE participants SET ${fields.join(', ')} WHERE id = ?`, values);

  return c.json({ success: true });
});

// GET /participant/:id/treatment
client.get('/participant/:participantId/treatment', async (c) => {
  const { participantId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.* FROM treatments t
     JOIN participants p ON p.treatmentId = t.id
     WHERE p.id = ?`,
    [participantId]
  );
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);

  const treatment = rows[0];
  return c.json({
    result: {
      id: treatment.id,
      demetricate: !!treatment.demetricate,
      ...treatment.config,
    },
  });
});

// GET /participant/:id/isStudyOver
client.get('/participant/:participantId/isStudyOver', async (c) => {
  const { participantId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT status FROM participants WHERE id = ?',
    [participantId]
  );
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);

  return c.json({ isStudyOver: rows[0].status === 'COMPLETED' });
});

// POST /participant/:id/participantLogs
client.post('/participant/:participantId/participantLogs', async (c) => {
  const { participantId } = c.req.param();
  const logs = await c.req.json();

  // Accept both single log and array of logs
  const logsArray = Array.isArray(logs) ? logs : [logs];

  for (const log of logsArray) {
    await db.query(
      'INSERT INTO participant_logs (participantId, logType, data) VALUES (?, ?, ?)',
      [participantId, log.logType || 'general', JSON.stringify(log)]
    );
  }

  return c.json({ success: true, count: logsArray.length });
});

// GET /treatment/:id
client.get('/treatment/:treatmentId', async (c) => {
  const { treatmentId } = c.req.param();
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM treatments WHERE id = ?',
    [treatmentId]
  );
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ result: rows[0] });
});

export default client;

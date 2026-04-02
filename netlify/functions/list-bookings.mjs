import { ensureSchema, getSql } from './_shared.mjs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    const sql = getSql();
    await ensureSchema(sql);
    const bookings = await sql`
      SELECT *
      FROM bookings
      ORDER BY created_at DESC, id DESC
      LIMIT 300;
    `;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookings }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err?.message || 'Server error' }) };
  }
};

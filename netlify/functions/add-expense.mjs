import { ensureSchema, getSql, json } from './_shared.mjs';

export default async (req) => {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    const { title, amount, expense_date, notes } = await req.json();

    if (!title || Number(amount) < 0 || Number.isNaN(Number(amount))) {
      return json({ error: 'Valid title and amount are required' }, 400);
    }

    const rows = await sql`
      INSERT INTO expenses (title, amount, expense_date, notes)
      VALUES (${title}, ${Number(amount)}, ${expense_date || new Date().toISOString().slice(0,10)}, ${notes || ''})
      RETURNING *
    `;

    return json({ success: true, expense: rows[0] });
  } catch (err) {
    return json({ error: err.message || 'Failed to add expense' }, 500);
  }
};

import { ensureSchema, getSql } from './_shared.mjs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const sql = getSql();
    await ensureSchema(sql);
    const month = event.queryStringParameters?.month || new Date().toISOString().slice(0, 7);

    const [bookingSummary] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN total_price::numeric ELSE 0 END), 0) AS booked_income,
        COALESCE(SUM(CASE WHEN status = 'Done' THEN total_price::numeric ELSE 0 END), 0) AS received_income,
        COUNT(*) FILTER (WHERE status <> 'Cancelled') AS active_bookings,
        COUNT(*) FILTER (WHERE status = 'Done') AS done_bookings
      FROM bookings
      WHERE TO_CHAR(COALESCE(shooting_datetime, created_at), 'YYYY-MM') = ${month}
    `;

    const [expenseSummary] = await sql`
      SELECT COALESCE(SUM(amount), 0) AS expenses_total
      FROM expenses
      WHERE TO_CHAR(expense_date, 'YYYY-MM') = ${month}
    `;

    const expenses = await sql`
      SELECT * FROM expenses
      WHERE TO_CHAR(expense_date, 'YYYY-MM') = ${month}
      ORDER BY expense_date DESC, id DESC
      LIMIT 100
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month,
        summary: {
          booked_income: Number(bookingSummary?.booked_income || 0),
          received_income: Number(bookingSummary?.received_income || 0),
          expenses_total: Number(expenseSummary?.expenses_total || 0),
          revenue: Number(bookingSummary?.received_income || 0) - Number(expenseSummary?.expenses_total || 0),
          active_bookings: Number(bookingSummary?.active_bookings || 0),
          done_bookings: Number(bookingSummary?.done_bookings || 0)
        },
        expenses
      })
    };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err?.message || 'Server error' }) };
  }
};

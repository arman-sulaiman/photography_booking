import { ensureSchema, getSql, json, sendBookingEmail } from './_shared.mjs';

export default async (req) => {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    const { id, status } = await req.json();

    if (!id || !status) return json({ error: 'Missing id or status' }, 400);

    const updated = await sql`
      UPDATE bookings
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    const booking = updated?.[0];
    if (!booking) return json({ error: 'Booking not found' }, 404);

    if (status === 'Cancelled') {
      await sendBookingEmail('status_cancelled', booking);
    }

    return json({ success: true, booking });
  } catch (err) {
    return json({ error: err.message || 'Status update failed' }, 500);
  }
};

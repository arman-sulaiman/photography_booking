import { ensureSchema, getSql, json, sendBookingEmail } from './_shared.mjs';

export default async (req) => {
  try {
    const { id } = await req.json();
    if (!id) return json({ error: 'Missing booking id' }, 400);

    const sql = getSql();
    await ensureSchema(sql);

    const rows = await sql`SELECT * FROM bookings WHERE id = ${Number(id)} LIMIT 1`;
    const booking = rows?.[0];
    if (!booking) return json({ error: 'Booking not found' }, 404);

    await sendBookingEmail('cancelled', { ...booking, status: 'Cancelled' });
    await sql`DELETE FROM bookings WHERE id = ${Number(id)}`;

    return json({ success: true });
  } catch (err) {
    return json({ error: err.message || 'Failed to delete booking' }, 500);
  }
};

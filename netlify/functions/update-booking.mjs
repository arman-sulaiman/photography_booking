import { ensureSchema, getSql, json, sendBookingEmail } from './_shared.mjs';

export default async (req) => {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    const data = await req.json();
    const id = Number(data?.id);
    if (!id) return json({ error: 'Missing booking id' }, 400);

    const updated = await sql`
      UPDATE bookings
      SET
        package_id = ${data.package_id},
        package_price = ${data.package_price},
        package_name = ${data.package_name},
        total_price = ${data.total_price},
        name = ${data.name},
        phone = ${data.phone},
        email = ${data.email},
        address = ${data.address},
        shooting_datetime = ${data.shooting_datetime},
        notes = ${data.notes || ''},
        addon_extra_edit = ${data.addon_extra_edit || 'no'},
        extra_edit_qty = ${data.extra_edit_qty || '0'},
        addon_video = ${data.addon_video || 'no'},
        addon_express = ${data.addon_express || 'no'},
        addon_travel_outside = ${data.addon_travel_outside || 'no'},
        status = ${data.status || 'Pending'},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const booking = updated?.[0];
    if (!booking) return json({ error: 'Booking not found' }, 404);

    await sendBookingEmail('updated', booking);
    return json({ success: true, booking });
  } catch (err) {
    return json({ error: err.message || 'Failed to update booking' }, 500);
  }
};

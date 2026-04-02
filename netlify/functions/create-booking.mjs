import { ensureSchema, generateBookingId, getSql, json, sendBookingEmail } from './_shared.mjs';

export default async (req) => {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    const data = await req.json();

    const {
      package_id,
      package_price,
      package_name,
      total_price,
      name,
      phone,
      email,
      address,
      shooting_datetime,
      notes,
      addon_extra_edit,
      extra_edit_qty,
      addon_video,
      addon_express,
      addon_travel_outside
    } = data || {};

    const booking_id = await generateBookingId(sql, new Date().toISOString());

    const inserted = await sql`
      INSERT INTO bookings (
        booking_id,
        package_id,
        package_price,
        package_name,
        total_price,
        name,
        phone,
        email,
        address,
        shooting_datetime,
        notes,
        addon_extra_edit,
        extra_edit_qty,
        addon_video,
        addon_express,
        addon_travel_outside,
        status,
        updated_at
      )
      VALUES (
        ${booking_id},
        ${package_id},
        ${package_price},
        ${package_name},
        ${total_price},
        ${name},
        ${phone},
        ${email},
        ${address},
        ${shooting_datetime},
        ${notes || ''},
        ${addon_extra_edit || 'no'},
        ${extra_edit_qty || '0'},
        ${addon_video || 'no'},
        ${addon_express || 'no'},
        ${addon_travel_outside || 'no'},
        'Pending',
        NOW()
      )
      RETURNING *
    `;

    const booking = inserted?.[0];
    await sendBookingEmail('created', booking);
    return json({ success: true, booking });
  } catch (err) {
    return json({ error: err.message || 'Failed to create booking' }, 500);
  }
};

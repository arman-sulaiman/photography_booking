import { neon } from '@netlify/neon';
import { Resend } from 'resend';

export function getSql() {
  return neon();
}

export async function ensureSchema(sql) {
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_id TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql`CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings (booking_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function getResendApiKey() {
  return (
    process.env.RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    Object.entries(process.env).find(([key, value]) => key.startsWith('re_') && value)?.[1] ||
    ''
  );
}

export function getResend() {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDateTime(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/London'
  }).format(date);
}

export function buildAddonList(booking = {}) {
  const addons = [];
  if (booking.addon_extra_edit === 'yes') addons.push(`Extra edit (${booking.extra_edit_qty || 0} photo${Number(booking.extra_edit_qty || 0) === 1 ? '' : 's'})`);
  if (booking.addon_video === 'yes') addons.push('Video reel');
  if (booking.addon_express === 'yes') addons.push('Express delivery');
  if (booking.addon_travel_outside === 'yes') addons.push('Travel outside city');
  return addons.length ? addons.join(', ') : 'None';
}

export async function generateBookingId(sql, dateValue) {
  const bookingDate = dateValue ? new Date(dateValue) : new Date();
  const yy = String(bookingDate.getUTCFullYear()).slice(-2);
  const mm = String(bookingDate.getUTCMonth() + 1).padStart(2, '0');
  const prefix = `${yy}${mm}`;

  const rows = await sql`
    SELECT booking_id
    FROM bookings
    WHERE booking_id LIKE ${prefix + '-%'}
    ORDER BY booking_id DESC
    LIMIT 1
  `;

  const last = rows?.[0]?.booking_id || '';
  const lastSerial = Number(String(last).split('-')[1] || 0);
  const nextSerial = String(lastSerial + 1).padStart(3, '0');
  return `${prefix}-${nextSerial}`;
}

function emailFrame({ title, intro, bodyHtml, footerNote = '' }) {
  return `
  <div style="background:#0f172a;padding:40px 20px;font-family:Arial,sans-serif;color:#e2e8f0;">
    <div style="max-width:640px;margin:auto;background:#020617;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#34d399,#22d3ee);margin-right:12px;"></div>
        <div>
          <div style="font-size:12px;color:#94a3b8;">MASRUF IFTY</div>
          <div style="font-size:16px;font-weight:bold;">Photography</div>
        </div>
      </div>
      <div style="padding:28px;">
        <h2 style="margin-top:0;color:#ffffff;font-size:22px;">${title}</h2>
        <p style="color:#cbd5e1;line-height:1.7;">${intro}</p>
        ${bodyHtml}
        ${footerNote ? `<p style="margin-top:26px;color:#cbd5e1;line-height:1.7;">${footerNote}</p>` : ''}
        <p style="margin-top:20px;color:#cbd5e1;">Best regards,<br><strong>Masruf Ifty Photography</strong></p>
      </div>
      <div style="padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.08);">
        © ${new Date().getFullYear()} Masruf Ifty Photography, London
      </div>
    </div>
  </div>`;
}

function bookingTable(booking) {
  return `
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-top:20px;border:1px solid rgba(255,255,255,0.08);">
      <table style="width:100%;font-size:14px;border-collapse:collapse;color:#e2e8f0;">
        <tr><td style="padding:6px 0;color:#94a3b8;">Booking ID</td><td style="text-align:right;font-weight:600;">${escapeHtml(booking.booking_id || '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">Package</td><td style="text-align:right;font-weight:600;">${escapeHtml(booking.package_name || '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">Shooting Date</td><td style="text-align:right;font-weight:600;">${escapeHtml(formatDateTime(booking.shooting_datetime))}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">Add-ons</td><td style="text-align:right;">${escapeHtml(buildAddonList(booking))}</td></tr>
        <tr><td style="padding:10px 0;color:#94a3b8;">Amount</td><td style="text-align:right;font-weight:bold;color:#34d399;font-size:16px;">£${escapeHtml(Number(booking.total_price || 0).toFixed(2))}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">Status</td><td style="text-align:right;font-weight:600;">${escapeHtml(booking.status || 'Pending')}</td></tr>
      </table>
    </div>
  `;
}

export async function sendBookingEmail(type, booking) {
  const resend = getResend();
  if (!resend || !booking?.email) return { skipped: true };

  const name = escapeHtml(booking.name || 'Client');
  let subject = 'Booking Update – Masruf Ifty Photography';
  let title = 'Booking Updated';
  let intro = `Hi <strong>${name}</strong>, your booking details have been updated.`;
  let footerNote = 'If anything still needs to be changed, simply reply to this email.';

  if (type === 'created') {
    subject = 'Booking Confirmation – Masruf Ifty Photography';
    title = 'Booking Confirmed';
    intro = `Hi <strong>${name}</strong>, thank you for booking with <strong>Masruf Ifty Photography</strong>. Your request has been received.`;
  } else if (type === 'cancelled') {
    subject = 'Booking Cancelled – Masruf Ifty Photography';
    title = 'Booking Cancelled';
    intro = `Hi <strong>${name}</strong>, this email confirms that your booking has been cancelled.`;
    footerNote = 'If you would like to rebook another date, please submit a new enquiry through our website.';
  } else if (type === 'status_cancelled') {
    subject = 'Booking Cancelled – Masruf Ifty Photography';
    title = 'Booking Status Updated';
    intro = `Hi <strong>${name}</strong>, your booking status has been updated to <strong>Cancelled</strong>.`;
    footerNote = 'If this was changed by mistake, please contact us and we will help you right away.';
  }

  const notesBlock = booking.notes
    ? `<div style="margin-top:20px;color:#cbd5e1;"><strong>Notes</strong><p style="margin-top:6px;">${escapeHtml(booking.notes)}</p></div>`
    : '';

  return resend.emails.send({
    from: 'Masruf Ifty Photography <photography@masruf-ifty.me>',
    to: booking.email,
    subject,
    html: emailFrame({
      title,
      intro,
      bodyHtml: `${bookingTable(booking)}${notesBlock}`,
      footerNote
    })
  });
}

# Masruf Ifty Photography Booking Website

Updated version with:
- Booking ID generation (`YYMM-serial`, example `2604-001`)
- Booking confirmation email after create
- Cancellation email after booking cancellation / delete
- Booking edit option from admin with email after update
- New landing homepage
- Separate booking page
- Finance page with monthly income, expenses and revenue
- SEO improvements (meta tags, canonical tags, sitemap, robots)

## Important environment variables for Netlify
Add these in Netlify Site Settings → Environment Variables:

- `NETLIFY_DATABASE_URL` or your existing Neon variable used by `@netlify/neon`
- `RESEND_API_KEY` = your Resend API key

## Database
The functions try to add missing columns/tables automatically.
If you prefer to prepare the database manually, run `setup.sql`.

## New admin pages
- `/dashboard.html`
- `/admin+ifty+arman_private019.html`
- `/finance.html`

## Notes
- Booking income in Finance counts all non-cancelled bookings for “Booked Income”.
- “Received Income” counts bookings marked as `Done`.
- Revenue = Received Income - Expenses.

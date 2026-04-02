import { neon } from "@netlify/neon";

export default async () => {
  try {
    const sql = neon();

    const reviews = await sql`
      SELECT * FROM reviews
      ORDER BY created_at DESC
    `;

    return new Response(
      JSON.stringify({ reviews }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};

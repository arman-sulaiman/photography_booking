import { neon } from "@netlify/neon";

export default async (req) => {
  try {
    const { name, rating, message } = await req.json();

    if (!name || !rating || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const sql = neon();

    await sql`
      INSERT INTO reviews (name, rating, message)
      VALUES (${name}, ${Number(rating)}, ${message})
    `;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};

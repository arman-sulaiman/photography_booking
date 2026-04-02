export default async (req) => {
  try {
    const { username, password } = await req.json();

    // 🔐 Change these credentials
    const SUPER_USER = "iftybabe";
    const SUPER_PASS = "iftybabe@@";

    if (username === SUPER_USER && password === SUPER_PASS) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );

  } catch {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
};

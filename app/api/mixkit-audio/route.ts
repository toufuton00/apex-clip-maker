export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://api.mixkit.co/free-sound-effects/", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch audio" }),
        { status: 500 }
      );
    }

    const data = await res.text();

    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
}
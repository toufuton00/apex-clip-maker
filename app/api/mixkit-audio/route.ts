export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://mixkit.co/free-stock-music/", {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Mixkit fetch failed", status: res.status }),
        { status: 500 }
      );
    }

    const html = await res.text();

    // 超シンプル抽出（Edge対応）
    const matches = [...html.matchAll(/https:\/\/assets\.mixkit\.co\/music\/preview\/mixkit-[^"]+\.mp3/g)];

    const unique = [...new Set(matches.map(m => m[0]))];

    const result = unique.slice(0, 5);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch audio",
        detail: String(err),
      }),
      { status: 500 }
    );
  }
}
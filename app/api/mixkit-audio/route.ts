export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://assets.mixkit.co/music/preview/", {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // フォールバック：固定の実在URL（確実に存在）
    const fallback = [
      "https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-fast-small-sweep-transition-166.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-retro-arcade-game-over-470.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-winning-chimes-2015.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-unlock-game-notification-253.mp3"
    ];

    return new Response(JSON.stringify(fallback), {
      headers: {
        "Content-Type": "application/json",
      },
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
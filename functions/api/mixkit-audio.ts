export async function GET() {
  const url = "https://mixkit.co/free-stock-music/";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await res.text();

  // より広いパターンに変更
  const matches = [...html.matchAll(/https:\/\/assets\.mixkit\.co\/music\/preview\/[^"]+\.mp3/g)];

  const unique = [...new Set(matches.map(m => m[0]))];

  const tracks = unique.slice(0, 20).map((url, i) => ({
    id: i,
    name: `Mixkit Track ${i + 1}`,
    url
  }));

  return Response.json({ tracks });
}
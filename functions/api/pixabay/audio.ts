export const onRequestGet = async (context: any) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const query = url.searchParams.toString();

  const apiKey = env.PIXABAY_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing PIXABAY_API_KEY" }),
      { status: 500 }
    );
  }

  const pixabayUrl = `https://pixabay.com/api/audio/?key=${apiKey}&${query}`;

  const res = await fetch(pixabayUrl, {
    headers: {
      "User-Agent": "Cloudflare Pages"
    }
  });

  const data = await res.text();

  return new Response(data, {
    headers: { "Content-Type": "application/json" },
  });
};
export const onRequestGet = async ({ request, env }: any) => {
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
    method: "GET",
    headers: {
      "Accept": "application/json",
      "User-Agent": "apex-clip-maker/1.0",
      "Referer": "https://pixabay.com/",
      "Origin": "https://pixabay.com",
    },
  });

  const text = await res.text();

  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
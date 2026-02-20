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

  const pixabayUrl =
    `https://pixabay.com/api/audio/?key=${apiKey}&${query}`;

  const res = await fetch(pixabayUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://pixabay.com/",
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text, { status: res.status });
  }

  const data = await res.text();

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
};
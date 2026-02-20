export async function onRequest(context: any) {
    const { request, env } = context;
  
    const url = new URL(request.url);
    const query = url.searchParams.toString();
  
    const apiKey = env.NEXT_PUBLIC_PIXABAY_API_KEY;
  
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "APIキーが設定されていません" }),
        { status: 500 }
      );
    }
  
    const res = await fetch(
      `https://pixabay.com/api/audio/?key=${apiKey}&${query}`
    );
  
    const data = await res.text();
  
    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
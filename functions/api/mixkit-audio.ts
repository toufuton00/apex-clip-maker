export const onRequestGet = async () => {
    const url = "https://mixkit.co/free-stock-music/";
  
    const res = await fetch(url);
    const html = await res.text();
  
    // mp3 URL抽出
    const matches = [...html.matchAll(/https:\/\/assets\.mixkit\.co\/music\/preview\/mixkit-[^"]+\.mp3/g)];
  
    const unique = [...new Set(matches.map(m => m[0]))];
  
    const tracks = unique.slice(0, 20).map((url, i) => ({
      id: i,
      name: `Track ${i + 1}`,
      url
    }));
  
    return new Response(JSON.stringify({ tracks }), {
      headers: { "Content-Type": "application/json" }
    });
  };
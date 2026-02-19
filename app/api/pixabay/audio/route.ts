import { NextRequest, NextResponse } from "next/server";

export type PixabayAudioHit = {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  preview: { url: string };
  name?: string;
  username?: string;
};

export type PixabayAudioResponse = {
  total: number;
  totalHits: number;
  hits: PixabayAudioHit[];
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "PIXABAY_API_KEYが設定されていません" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "game music";
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q,
      page,
      per_page: perPage,
      lang: "ja",
    });

    const res = await fetch(
      `https://pixabay.com/api/audio/?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Pixabay API エラー: ${text}` },
        { status: res.status }
      );
    }

    const data: PixabayAudioResponse = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "音源の取得に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

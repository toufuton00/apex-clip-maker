"use client";

import { useState, useCallback } from "react";

export type PixabayAudioTrack = {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  previewUrl: string;
  name?: string;
  username?: string;
};

type PixabayApiHit = {
  id: number;
  pageURL: string;
  type?: string;
  tags?: string;
  duration?: number;
  preview?: { url?: string } | string;
  preview_URL?: string;
  name?: string;
  username?: string;
};

export function usePixabayAudio() {
  const [tracks, setTracks] = useState<PixabayAudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHits, setTotalHits] = useState(0);

  const fetchAudio = useCallback(async (query = "game music", page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query, page: String(page), per_page: "20" });
      const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

      const res = await fetch(
        `https://pixabay.com/api/audio/?key=${apiKey}&${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "音源の取得に失敗しました");
      }

      const hits: PixabayApiHit[] = data.hits || [];
      const mapped: PixabayAudioTrack[] = hits.map((h) => ({
        id: h.id,
        pageURL: h.pageURL,
        type: h.type || "music",
        tags: h.tags || "",
        duration: h.duration || 0,
        previewUrl:
          (typeof h.preview === "string" ? h.preview : h.preview?.url) || h.preview_URL || "",
        name: h.name,
        username: h.username,
      }));

      setTracks(mapped);
      setTotalHits(data.totalHits ?? data.total ?? 0);
      return mapped;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "音源の取得に失敗しました";
      setError(msg);
      setTracks([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tracks, isLoading, error, totalHits, fetchAudio };
}

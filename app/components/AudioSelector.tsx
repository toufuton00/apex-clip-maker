"use client";

import { useState, useEffect, useRef } from "react";
import type { PixabayAudioTrack } from "../lib/usePixabayAudio";

const PRESET_OPTIONS = [
  { id: "none", label: "なし", icon: "🔇" },
  { id: "original", label: "オリジナル", icon: "🎬" },
];

const SEARCH_QUERIES = ["game music", "epic", "electronic", "ambient", "action"];

type Props = {
  selectedId: string | null;
  selectedPixabayTrack: PixabayAudioTrack | null;
  onSelectPreset: (id: string) => void;
  onSelectPixabay: (track: PixabayAudioTrack | null) => void;
  fetchAudio: (query: string, page?: number) => Promise<PixabayAudioTrack[]>;
  tracks: PixabayAudioTrack[];
  isLoading: boolean;
  error: string | null;
};

export function AudioSelector({
  selectedId,
  selectedPixabayTrack,
  onSelectPreset,
  onSelectPixabay,
  fetchAudio,
  tracks,
  isLoading,
  error,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("game music");
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchAudio(searchQuery, 1);
  }, [searchQuery, fetchAudio]);

  const handlePlay = (track: PixabayAudioTrack) => {
    if (playingId === track.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    audio.play();
    setPlayingId(track.id);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  const handleSelectPixabay = (track: PixabayAudioTrack) => {
    onSelectPreset("");
    onSelectPixabay(selectedPixabayTrack?.id === track.id ? null : track);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
        <span className="text-xl">🎵</span> 音源を選択
      </h2>

      {/* プリセット */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {PRESET_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              onSelectPixabay(null);
              onSelectPreset(opt.id);
            }}
            className={`min-h-[48px] py-3 px-4 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2 tap-target ${
              selectedId === opt.id && !selectedPixabayTrack
                ? "bg-red-500/90 text-white ring-2 ring-red-400/50"
                : "bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80"
            }`}
          >
            <span className="text-lg">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Pixabay検索 */}
      <div className="mb-4">
        <p className="text-sm sm:text-base text-white/60 mb-3">PixabayからBGMを検索</p>
        <div className="flex flex-wrap gap-2">
          {SEARCH_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setSearchQuery(q)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm sm:text-base font-medium transition-all tap-target ${
                searchQuery === q ? "bg-red-500/80 text-white" : "bg-white/10 text-white/80 hover:bg-white/15 active:bg-white/20"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="検索キーワード..."
          className="mt-3 w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-base focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/20 text-red-400 text-base">
          {error}
          <p className="text-xs mt-1 text-white/60">
            .env.local に PIXABAY_API_KEY を設定してください。無料で取得:{" "}
            <a
              href="https://pixabay.com/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              pixabay.com/api/docs
            </a>
          </p>
        </div>
      )}

      {/* 音源一覧 */}
      <div className="max-h-52 sm:max-h-56 overflow-y-auto space-y-2 scrollbar-hide pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <p className="text-white/50 text-base py-6 text-center">
            {error ? "APIキーを設定してください" : "該当する音源がありません"}
          </p>
        ) : (
          tracks.map((track) => {
            const isSelected = selectedPixabayTrack?.id === track.id;
            const isPlaying = playingId === track.id;
            return (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all min-h-[64px] ${
                  isSelected ? "bg-red-500/30 ring-1 ring-red-500/50" : "bg-white/5 hover:bg-white/10 active:bg-white/15"
                }`}
              >
                <button
                  onClick={() => handlePlay(track)}
                  className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 flex items-center justify-center tap-target"
                >
                  {isPlaying ? (
                    <span className="text-red-500 text-lg">⏸</span>
                  ) : (
                    <span className="text-white/90 text-lg ml-0.5">▶</span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-base text-white/90 truncate">
                    {track.name || track.tags?.split(",")[0] || `Track ${track.id}`}
                  </p>
                  <p className="text-sm text-white/50">{formatDuration(track.duration)}</p>
                </div>
                <button
                  onClick={() => handleSelectPixabay(track)}
                  className={`flex-shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium tap-target ${
                    isSelected ? "bg-red-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/25"
                  }`}
                >
                  {isSelected ? "選択中" : "選択"}
                </button>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-3 text-[10px] text-white/40">
        音源提供:{" "}
        <a
          href="https://pixabay.com/music/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/60"
        >
          Pixabay
        </a>
      </p>
    </section>
  );
}

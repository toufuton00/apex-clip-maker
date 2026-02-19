"use client";

import { useState, useRef, useEffect } from "react";
import { VideoThumbnail } from "./components/VideoThumbnail";
import { AudioSelector } from "./components/AudioSelector";
import { useFFmpeg } from "./lib/useFFmpeg";
import { usePixabayAudio } from "./lib/usePixabayAudio";
import { useBPMAnalysis } from "./lib/useBPMAnalysis";
import { getBeatDurationSeconds } from "./lib/beatUtils";
import type { PixabayAudioTrack } from "./lib/usePixabayAudio";

export default function Home() {
  const [videos, setVideos] = useState<File[]>([]);
  const [selectedAudioPreset, setSelectedAudioPreset] = useState<string>("original");
  const [selectedPixabayTrack, setSelectedPixabayTrack] = useState<PixabayAudioTrack | null>(null);
  const { tracks, isLoading, error, fetchAudio } = usePixabayAudio();
  const { bpm, isAnalyzing: isBpmAnalyzing, error: bpmError, analyzeFromUrl, reset: resetBpm } = useBPMAnalysis();
  const [manualBpm, setManualBpm] = useState<string>("120");
  const [bpmOverride, setBpmOverride] = useState<number | null>(null);
  const [useBeatSync, setUseBeatSync] = useState(true);
  const [clipsPerBeat, setClipsPerBeat] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mergeVideos, mergeVideosWithBeats, isLoading: isFFmpegLoading, error: ffmpegError } = useFFmpeg();

  const effectiveBpm = bpmOverride ?? bpm ?? (manualBpm ? parseInt(manualBpm, 10) : 120);
  const isValidBpm = effectiveBpm >= 60 && effectiveBpm <= 200;

  useEffect(() => {
    if (selectedPixabayTrack?.previewUrl) {
      setBpmOverride(null);
      analyzeFromUrl(selectedPixabayTrack.previewUrl);
    } else {
      resetBpm();
      setBpmOverride(null);
    }
  }, [selectedPixabayTrack?.id, selectedPixabayTrack?.previewUrl, analyzeFromUrl, resetBpm]);

  // Tone.js TransportをBPMに同期（ビート配置の基準として使用）
  useEffect(() => {
    if (useBeatSync && isValidBpm) {
      import("tone").then((mod) => {
        const Tone = mod.default;
        if (Tone?.getTransport) {
          Tone.getTransport().bpm.value = effectiveBpm;
        }
      });
    }
  }, [useBeatSync, isValidBpm, effectiveBpm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newVideos = Array.from(files).filter((f) => f.type.startsWith("video/"));
    setVideos((prev) => [...prev, ...newVideos]);
    setPreviewIndex(0);
    setIsGenerated(false);
    setMergedBlob(null);
    e.target.value = "";
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setPreviewIndex((prev) => Math.min(prev, Math.max(0, videos.length - 2)));
    setIsGenerated(false);
    setMergedBlob(null);
  };

  const handleGenerate = async () => {
    if (videos.length === 0) return;
    setIsGenerating(true);
    setIsGenerated(false);
    setMergedBlob(null);
    try {
      let blob: Blob;
      if (useBeatSync && isValidBpm) {
        blob = await mergeVideosWithBeats(videos, {
          bpm: effectiveBpm,
          clipsPerBeat,
          audioUrl: selectedPixabayTrack?.previewUrl ?? null,
        });
      } else {
        blob = await mergeVideos(videos);
      }
      setMergedBlob(blob);
      setIsGenerated(true);
    } catch {
      // エラーは useFFmpeg で setError 済み
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apex-clip-${Date.now()}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentPreview = videos[previewIndex];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPreview) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(currentPreview);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [currentPreview]);

  return (
    <main className="min-h-dvh pb-safe pt-safe">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 glass border-b border-white/10 pt-safe">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            APEX Clip Maker
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6">
        {/* 動画アップロード */}
        <section className="glass rounded-2xl p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <span className="text-xl">📹</span> クリップをアップロード
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[80px] sm:min-h-[96px] py-5 sm:py-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-red-500/50 active:bg-white/10 transition-all duration-200 flex flex-col items-center justify-center gap-2 tap-target"
          >
            <span className="text-4xl sm:text-5xl">➕</span>
            <span className="text-base sm:text-lg text-white/70">タップして動画を選択</span>
            <span className="text-sm text-white/50">複数選択OK</span>
          </button>
          {videos.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-hide">
              {videos.map((v, i) => (
                <VideoThumbnail
                  key={`${v.name}-${i}-${v.lastModified}`}
                  file={v}
                  isSelected={previewIndex === i}
                  index={i}
                  onSelect={() => setPreviewIndex(i)}
                  onRemove={() => removeVideo(i)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 動画プレビュー (9:16) */}
        <section className="glass rounded-2xl p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <span className="text-xl">🖼️</span> プレビュー
          </h2>
          <div className="aspect-[9/16] max-h-[45vh] sm:max-h-[50vh] mx-auto rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center w-full">
            {currentPreview ? (
              <video
                key={previewIndex}
                src={previewUrl || ""}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-white/40 text-center p-6">
                <span className="text-4xl block mb-2">📱</span>
                <span className="text-sm">動画をアップロードすると<br />ここに表示されます</span>
              </div>
            )}
          </div>
          {videos.length > 1 && (
            <div className="flex justify-center gap-2 sm:gap-3 mt-3">
              {videos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIndex(i)}
                  className={`min-w-[10px] min-h-[10px] w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all tap-target ${
                    i === previewIndex ? "bg-red-500 w-6 sm:w-8" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* 音源選択 */}
        <AudioSelector
          selectedId={selectedAudioPreset}
          selectedPixabayTrack={selectedPixabayTrack}
          onSelectPreset={setSelectedAudioPreset}
          onSelectPixabay={setSelectedPixabayTrack}
          fetchAudio={fetchAudio}
          tracks={tracks}
          isLoading={isLoading}
          error={error}
        />

        {/* BPM・ビート配置 */}
        <section className="glass rounded-2xl p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <span className="text-xl">🥁</span> ビート配置
          </h2>
          <label className="flex items-center gap-3 mb-4 cursor-pointer min-h-[48px] tap-target">
            <input
              type="checkbox"
              checked={useBeatSync}
              onChange={(e) => setUseBeatSync(e.target.checked)}
              className="rounded border-white/30 w-5 h-5 sm:w-6 sm:h-6"
            />
            <span className="text-base sm:text-lg text-white/80">ビートに合わせてクリップ配置</span>
          </label>
          {useBeatSync && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base text-white/70">BPM:</span>
                {isBpmAnalyzing ? (
                  <span className="text-white/60 text-base flex items-center gap-2 min-h-[48px]">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    解析中...
                  </span>
                ) : (
                  <>
                    <input
                      type="number"
                      min={60}
                      max={200}
                      value={bpmOverride ?? bpm ?? manualBpm}
                      onChange={(e) => {
                        const v = e.target.value;
                        const n = parseInt(v, 10);
                        setManualBpm(v);
                        setBpmOverride(isNaN(n) ? null : n);
                      }}
                      className="w-20 min-h-[48px] px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-base"
                    />
                    {(bpm && !bpmOverride) && <span className="text-sm text-green-400">(自動解析)</span>}
                  </>
                )}
              </div>
              {bpmError && (
                <p className="text-sm text-amber-400">{bpmError} 手動でBPMを入力してください。</p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-base text-white/70">1クリップ:</span>
                <div className="flex gap-2">
                  {([1, 2] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setClipsPerBeat(n)}
                      className={`min-h-[48px] min-w-[80px] px-4 py-3 rounded-xl text-base font-medium tap-target ${
                        clipsPerBeat === n ? "bg-red-500/90 text-white" : "bg-white/10 text-white/80"
                      }`}
                    >
                      {n}ビート
                    </button>
                  ))}
                </div>
                <span className="text-sm text-white/50">
                  ({getBeatDurationSeconds(effectiveBpm) * clipsPerBeat}秒/クリップ)
                </span>
              </div>
            </div>
          )}
        </section>

        {ffmpegError && (
          <div className="glass rounded-2xl p-4 sm:p-5 border border-red-500/50 text-red-400 text-base">
            {ffmpegError}
          </div>
        )}

        {/* 生成ボタン */}
        <button
          onClick={handleGenerate}
          disabled={videos.length === 0 || isGenerating}
          className={`w-full min-h-[56px] sm:min-h-[64px] py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all flex items-center justify-center gap-3 tap-target ${
            videos.length === 0 || isGenerating
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25 active:scale-[0.98]"
          }`}
        >
          {isGenerating ? (
            <>
              <span className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{isFFmpegLoading ? "読み込み中..." : "結合中..."}</span>
            </>
          ) : (
            <>✨ ショート動画を生成</>
          )}
        </button>

        {/* ダウンロードボタン */}
        <button
          onClick={handleDownload}
          disabled={!mergedBlob}
          className={`w-full min-h-[56px] sm:min-h-[64px] py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all flex items-center justify-center gap-3 tap-target ${
            !mergedBlob
              ? "glass text-white/40 cursor-not-allowed"
              : "glass-strong hover:bg-white/10 text-white border border-white/20 active:scale-[0.98]"
          }`}
        >
          <span className="text-2xl">⬇️</span>
          <span>{mergedBlob ? "MP4をダウンロード" : "生成後にダウンロード可能"}</span>
        </button>
      </div>
    </main>
  );
}

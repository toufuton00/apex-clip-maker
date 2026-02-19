"use client";

import { useState, useCallback } from "react";
import { analyze } from "web-audio-beat-detector";

/**
 * 音源のBPMを解析する（Tone.jsと連携、web-audio-beat-detectorでBPM検出）
 */
export function useBPMAnalysis() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFromUrl = useCallback(async (audioUrl: string): Promise<number | null> => {
    setIsAnalyzing(true);
    setError(null);
    setBpm(null);

    try {
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error("音源の取得に失敗しました");
      const arrayBuffer = await res.arrayBuffer();

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      const detectedBpm = await analyze(audioBuffer, {
        minTempo: 60,
        maxTempo: 200,
      });

      const rounded = Math.round(detectedBpm);
      setBpm(rounded);
      return rounded;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "BPMの解析に失敗しました";
      setError(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeFromFile = useCallback(async (file: File): Promise<number | null> => {
    setIsAnalyzing(true);
    setError(null);
    setBpm(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      const detectedBpm = await analyze(audioBuffer, {
        minTempo: 60,
        maxTempo: 200,
      });

      const rounded = Math.round(detectedBpm);
      setBpm(rounded);
      return rounded;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "BPMの解析に失敗しました";
      setError(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setBpm(null);
    setError(null);
  }, []);

  return {
    bpm,
    isAnalyzing,
    error,
    analyzeFromUrl,
    analyzeFromFile,
    reset,
  };
}

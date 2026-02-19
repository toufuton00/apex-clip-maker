"use client";

import { useState, useCallback, useRef } from "react";
import { getBeatDurationSeconds } from "./beatUtils";

type FFmpegInstance = Awaited<ReturnType<typeof loadFFmpeg>>;

export type MergeWithBeatsOptions = {
  bpm: number;
  clipsPerBeat?: number;
  audioUrl?: string | null;
};

async function loadFFmpeg() {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return { ffmpeg, fetchFile };
}

/**
 * 複数動画を結合してMP4を生成する
 */
export function useFFmpeg() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<FFmpegInstance | null>(null);

  const ensureLoaded = useCallback(async () => {
    if (instanceRef.current) return instanceRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const instance = await loadFFmpeg();
      instanceRef.current = instance;
      setIsReady(true);
      return instance;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "FFmpegの読み込みに失敗しました";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const mergeVideos = useCallback(async (files: File[]): Promise<Blob> => {
    if (files.length === 0) throw new Error("動画が選択されていません");

    const { ffmpeg, fetchFile } = await ensureLoaded();

    try {
      // 各動画を仮想FSに書き込み（拡張子を維持）
      const inputNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const ext = files[i].name.split(".").pop()?.toLowerCase() || "mp4";
        const name = `input${i}.${ext}`;
        inputNames.push(name);
        const data = await fetchFile(files[i]);
        await ffmpeg.writeFile(name, data);
      }

      // concat demuxer用のリストファイル作成
      const listContent = inputNames.map((n) => `file '${n}'`).join("\n");
      await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(listContent));

      // 結合 + 1080x1920縦動画出力（TikTok/YouTube Shorts対応）
      const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
      await ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "concat.txt",
        "-vf",
        scaleFilter,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "output.mp4",
      ]);

      // 出力を読み込み
      const data = await ffmpeg.readFile("output.mp4");

      // 型変換してBlob作成
      const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: "video/mp4" });
      
      // 仮想FSをクリア
      for (const name of inputNames) {
        try {
          await ffmpeg.deleteFile(name);
        } catch {
          /* ignore */
        }
      }
      try {
        await ffmpeg.deleteFile("concat.txt");
        await ffmpeg.deleteFile("output.mp4");
      } catch {
        /* ignore */
      }

      return blob;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "動画の結合に失敗しました";
      setError(msg);
      throw e;
    }
  }, [ensureLoaded]);

  /**
   * ビートに合わせてクリップを配置し結合（BGMオプション付き）
   */
  const mergeVideosWithBeats = useCallback(
    async (
      files: File[],
      options: MergeWithBeatsOptions
    ): Promise<Blob> => {
      if (files.length === 0) throw new Error("動画が選択されていません");

      const { bpm, clipsPerBeat = 1, audioUrl } = options;
      const beatDuration = getBeatDurationSeconds(bpm);
      const clipDuration = beatDuration * clipsPerBeat;

      const { ffmpeg, fetchFile } = await ensureLoaded();

      try {
        const inputNames: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const ext = files[i].name.split(".").pop()?.toLowerCase() || "mp4";
          const name = `input${i}.${ext}`;
          inputNames.push(name);
          const data = await fetchFile(files[i]);
          await ffmpeg.writeFile(name, data);
        }

        // 各クリップをビート長にトリム（短い場合はループ）
        const segmentNames: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const segName = `segment${i}.mp4`;
          segmentNames.push(segName);
          try {
            await ffmpeg.exec([
              "-stream_loop",
              "-1",
              "-t",
              String(clipDuration),
              "-i",
              inputNames[i],
              "-c",
              "copy",
              segName,
            ]);
          } catch {
            // -stream_loop未対応の場合は単純トリム
            await ffmpeg.exec([
              "-t",
              String(clipDuration),
              "-i",
              inputNames[i],
              "-c",
              "copy",
              segName,
            ]);
          }
        }

        // 結合 + 1080x1920縦動画出力（TikTok/YouTube Shorts対応）
        const listContent = segmentNames.map((n) => `file '${n}'`).join("\n");
        await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(listContent));

        const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
        await ffmpeg.exec([
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "concat.txt",
          "-vf",
          scaleFilter,
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "concat_out.mp4",
        ]);

        let outputName = "concat_out.mp4";

        // BGMを追加（動画は既に1080x1920なので -c:v copy）
        if (audioUrl) {
          try {
            const audioData = await fetchFile(audioUrl);
            await ffmpeg.writeFile("bgm.mp3", audioData);
            await ffmpeg.exec([
              "-i",
              "concat_out.mp4",
              "-i",
              "bgm.mp3",
              "-map",
              "0:v",
              "-map",
              "1:a",
              "-c:v",
              "copy",
              "-c:a",
              "aac",
              "-b:a",
              "128k",
              "-shortest",
              "output.mp4",
            ]);
            outputName = "output.mp4";
            try {
              await ffmpeg.deleteFile("bgm.mp3");
            } catch { /* ignore */ }
          } catch {
            // BGM結合失敗時は無音声で続行
          }
        }

        const data = await ffmpeg.readFile(outputName);

// 必ずUint8Arrayに変換
const uint8 = data instanceof Uint8Array
  ? data
  : new Uint8Array(data as unknown as ArrayBuffer);

// 新しいArrayBufferを作成（SharedArrayBuffer対策）
const safeBuffer = new Uint8Array(uint8).buffer;

// Blob生成
const blob = new Blob([safeBuffer], {
  type: "video/mp4",
});
   
        for (const name of [...inputNames, ...segmentNames]) {
          try {
            await ffmpeg.deleteFile(name);
          } catch { /* ignore */ }
        }
        try {
          await ffmpeg.deleteFile("concat.txt");
          await ffmpeg.deleteFile("concat_out.mp4");
          if (outputName === "output.mp4") await ffmpeg.deleteFile(outputName);
        } catch { /* ignore */ }

        return blob;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "動画の結合に失敗しました";
        setError(msg);
        throw e;
      }
    },
    [ensureLoaded]
  );

  return {
    mergeVideos,
    mergeVideosWithBeats,
    isLoading,
    isReady,
    error,
  };
}

/**
 * ビート・BPM計算ユーティリティ（Tone.jsのBPM概念に基づく）
 */

/**
 * BPMから1ビートの秒数を取得
 * Tone.js Transport.bpm と同じ計算
 */
export function getBeatDurationSeconds(bpm: number): number {
  return 60 / bpm;
}

/**
 * ビートに合わせたクリップの配置計画を生成
 * @param clipCount クリップ数
 * @param bpm BPM
 * @param clipsPerBeat 1クリップあたりのビート数（1=1ビート, 2=2ビート）
 */
export function getBeatAlignedPlan(
  clipCount: number,
  bpm: number,
  clipsPerBeat: number = 1
): { clipIndex: number; startTime: number; duration: number }[] {
  const beatDuration = 60 / bpm;
  const clipDuration = beatDuration * clipsPerBeat;

  return Array.from({ length: clipCount }, (_, i) => ({
    clipIndex: i,
    startTime: i * clipDuration,
    duration: clipDuration,
  }));
}

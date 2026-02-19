"use client";

import { useEffect, useState } from "react";

export function VideoThumbnail({
  file,
  isSelected,
  index,
  onSelect,
  onRemove,
}: {
  file: File;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!url) return null;

  return (
    <div className="flex-shrink-0 relative group">
      <button
        onClick={onSelect}
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden border-2 transition-all tap-target min-w-[64px] min-h-[96px] ${
          isSelected ? "border-red-500 ring-2 ring-red-500/30" : "border-white/20"
        }`}
      >
        <video
          src={url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      </button>
      <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/70 px-1.5 py-0.5 rounded font-medium">
        {index + 1}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-0.5 -right-0.5 w-8 h-8 rounded-full bg-red-500 text-white text-base flex items-center justify-center tap-target active:bg-red-600 shadow-lg opacity-90 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

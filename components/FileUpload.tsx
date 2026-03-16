"use client";

import { useCallback, useState, useRef } from "react";

export type UploadZoneState = "empty" | "staged" | "loaded" | "error";

interface FileUploadProps {
  label: string;
  accept: string;
  hint: string;
  /** Called when a file is staged (dropped/selected) — NOT processed yet */
  onStage: (file: File | null) => void;
  state: UploadZoneState;
  stagedFileName?: string | null;
  loadedFileName?: string | null;
  errorMessage?: string | null;
}

export default function FileUpload({
  label,
  accept,
  hint,
  onStage,
  state,
  stagedFileName,
  loadedFileName,
  errorMessage,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      onStage(file);
    },
    [onStage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so re-selecting the same file triggers onChange
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStage(null);
    },
    [onStage]
  );

  // Border & background styles per state
  const borderCls =
    dragOver
      ? "border-[#4FA3D1] bg-[#4FA3D1]/10"
      : state === "loaded"
      ? "border-green/60 bg-green/5 border-solid"
      : state === "error"
      ? "border-orange/60 bg-orange/5 border-solid"
      : state === "staged"
      ? "border-amber/50 bg-amber/5"
      : "border-border hover:border-[#4FA3D1]/60";

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${borderCls}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => {
        if (state !== "loaded") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {/* Loaded state */}
      {state === "loaded" && loadedFileName ? (
        <div className="flex flex-col items-center gap-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-green">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-green text-sm font-medium">
            ✓ {loadedFileName}
          </span>
          <span className="text-muted text-[10px]">Loaded</span>
        </div>
      ) : state === "staged" && stagedFileName ? (
        /* Staged state */
        <div className="flex flex-col items-center gap-1.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-amber">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-amber text-sm font-medium truncate max-w-full">
            {stagedFileName}
          </span>
          <button
            onClick={handleRemove}
            className="text-muted hover:text-orange text-[11px] underline underline-offset-2 transition-colors"
          >
            ✕ Remove
          </button>
        </div>
      ) : state === "error" ? (
        /* Error state */
        <div className="flex flex-col items-center gap-1">
          <UploadIcon className="text-orange" />
          <p className="text-white text-sm font-medium">{label}</p>
          {errorMessage && (
            <p className="text-orange text-xs mt-1">{errorMessage}</p>
          )}
          <p className="text-muted text-[11px] mt-1">Drop a new file to retry</p>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-1.5">
          <UploadIcon className="text-muted" />
          <p className="text-white text-sm font-medium">{label}</p>
          <p className="text-muted text-xs">{hint}</p>
        </div>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M11 14V3m0 0L7 7m4-4l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 14v2a3 3 0 003 3h10a3 3 0 003-3v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

"use client";

import { useCallback, useState, useRef } from "react";

interface FileUploadProps {
  label: string;
  accept: string;
  hint: string;
  onFile: (file: File) => void;
  loading?: boolean;
  success?: boolean;
  error?: string | null;
}

export default function FileUpload({
  label,
  accept,
  hint,
  onFile,
  loading = false,
  success = false,
  error = null,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFile(file);
    },
    [onFile]
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
    },
    [handleFile]
  );

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        dragOver
          ? "border-blue bg-blue/10"
          : success
          ? "border-green bg-green/5"
          : error
          ? "border-orange bg-orange/5"
          : "border-border hover:border-muted"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-muted text-sm">Processing {fileName}...</span>
        </div>
      ) : success && fileName ? (
        <div>
          <span className="text-green text-sm font-medium">{fileName} loaded</span>
        </div>
      ) : (
        <div>
          <p className="text-white text-sm font-medium mb-1">{label}</p>
          <p className="text-muted text-xs">{hint}</p>
          {error && <p className="text-orange text-xs mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}

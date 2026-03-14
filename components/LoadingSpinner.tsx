"use client";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      <span className="text-muted text-sm">{message}</span>
    </div>
  );
}

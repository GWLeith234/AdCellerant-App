"use client";

interface DocStatusGridProps {
  nda: string;
  msa: string;
  sow: string;
  credit: string;
  bizdev: string;
  partner: string;
}

const DOC_LABELS: Record<string, string> = {
  nda: "NDA",
  msa: "MSA",
  sow: "SOW",
  credit: "Credit App",
  bizdev: "BizDev Brief",
  partner: "Partner Form",
};

function statusColor(val: string): { bg: string; text: string; label: string } {
  if (!val) return { bg: "bg-muted/10", text: "text-muted", label: "Not started" };
  const v = val.toLowerCase();
  if (v === "signed" || v === "complete" || v === "done" || v === "approved")
    return { bg: "bg-green/10", text: "text-green", label: val };
  if (v === "out" || v === "in progress" || v === "started" || v === "sent" || v === "pending")
    return { bg: "bg-amber/10", text: "text-amber", label: val };
  if (v === "n/a")
    return { bg: "bg-muted/10", text: "text-muted", label: "N/A" };
  return { bg: "bg-muted/10", text: "text-muted", label: val || "Not started" };
}

export default function DocStatusGrid(props: DocStatusGridProps) {
  const docs = ["nda", "msa", "sow", "credit", "bizdev", "partner"] as const;

  return (
    <div className="grid grid-cols-2 gap-2">
      {docs.map((key) => {
        const val = props[key];
        const s = statusColor(val);
        return (
          <div key={key} className={`rounded-lg px-3 py-2.5 ${s.bg}`}>
            <p className="text-muted text-[10px] uppercase tracking-wider">
              {DOC_LABELS[key]}
            </p>
            <p className={`text-xs mt-0.5 font-medium capitalize ${s.text}`}>
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

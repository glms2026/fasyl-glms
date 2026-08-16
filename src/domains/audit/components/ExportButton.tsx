import { Download } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import type { AuditLogEntry } from "../types";

interface ExportButtonProps {
  /** The rows the CSV should contain — exactly what the timeline shows. */
  entries: AuditLogEntry[];
  className?: string;
}

const CSV_HEADER = ["id", "username", "action", "description", "createdAt"];

/** RFC-4180-ish escaping: quote fields containing separators, double quotes. */
function escapeCsvField(value: string | number): string {
  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(entries: AuditLogEntry[]): string {
  const rows = entries.map((entry) =>
    [entry.id, entry.username, entry.action, entry.description, entry.createdAt]
      .map(escapeCsvField)
      .join(","),
  );

  return [CSV_HEADER.join(","), ...rows].join("\r\n");
}

export function ExportButton({ entries, className }: ExportButtonProps) {
  const handleExport = () => {
    // BOM so Excel opens the file with UTF-8 instead of mojibake.
    const csv = `\uFEFF${toCsv(entries)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    toast.success("Audit log exported as CSV.");
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={entries.length === 0}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-4 text-sm font-medium whitespace-nowrap text-white shadow-sm backdrop-blur transition-all outline-none select-none hover:border-white/40 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      <Download className="size-4" aria-hidden="true" />

      {entries.length > 0 ? "Export CSV" : "No rows to export"}
    </button>
  );
}

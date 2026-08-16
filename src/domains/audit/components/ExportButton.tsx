import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { auditService } from "../services/auditService";
import type { AuditLogParams } from "../types";

interface ExportButtonProps {
  /** Current filters — the CSV reflects exactly what the timeline shows. */
  params: AuditLogParams;
  className?: string;
}

export function ExportButton({ params, className }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const blob = await auditService.exportCsv(params);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
      toast.success("Audit log exported as CSV.");
    } catch (caught) {
      toast.error(getApiErrorMessage(caught));
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleExport()}
      disabled={exporting}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-4 text-sm font-medium whitespace-nowrap text-white shadow-sm backdrop-blur transition-all outline-none select-none hover:border-white/40 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      <Download className="size-4" aria-hidden="true" />

      {exporting ? "Exporting…" : "Export CSV"}
    </button>
  );
}

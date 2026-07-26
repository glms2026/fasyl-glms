export function ChartLegend() {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#001A42]" />

        <span className="text-sm text-neutral-500">Income</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-sky-400" />

        <span className="text-sm text-neutral-500">Expenses</span>
      </div>
    </div>
  );
}

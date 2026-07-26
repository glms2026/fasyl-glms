interface ChartHeaderProps {
  title: string;
  subtitle?: string;
}

export function ChartHeader({ title, subtitle }: ChartHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>

        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>

      <button className="rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
        Last 6 Months
      </button>
    </div>
  );
}

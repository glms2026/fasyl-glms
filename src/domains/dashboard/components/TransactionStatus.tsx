import { cn } from "@/lib/utils";

interface Props {
  status: "Posted" | "Pending" | "Failed";
}

export function TransactionStatus({ status }: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        status === "Posted" && "bg-green-100 text-green-700",

        status === "Pending" && "bg-yellow-100 text-yellow-700",

        status === "Failed" && "bg-red-100 text-red-700",
      )}
    >
      {status}
    </span>
  );
}

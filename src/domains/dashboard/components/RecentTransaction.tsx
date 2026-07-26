import { ChevronRight } from "lucide-react";

import { transactions } from "./transaction.data";

import { TransactionRow } from "./TransactionRow";

export function RecentTransactions() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-neutral-200 p-6">
        <div>
          <h2 className="text-lg font-semibold">Recent Transactions</h2>

          <p className="mt-1 text-sm text-neutral-500">
            Latest journal activities
          </p>
        </div>

        <button className="flex items-center gap-2 text-sm font-medium text-[#001A42]">
          View All
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Table */}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Reference
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Type
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Amount
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Status
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Time
              </th>

              <th className="px-6 py-3" />
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Eye } from "lucide-react";

import { TransactionStatus } from "./TransactionStatus";
import type { Transaction } from "./transaction.data";

interface Props {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: Props) {
  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium">{transaction.reference}</p>

          <p className="text-sm text-neutral-500">{transaction.account}</p>
        </div>
      </td>

      <td className="px-6 py-4">{transaction.type}</td>

      <td className="px-6 py-4 font-medium">{transaction.amount}</td>

      <td className="px-6 py-4">
        <TransactionStatus status={transaction.status} />
      </td>

      <td className="px-6 py-4">{transaction.createdAt}</td>

      <td className="px-6 py-4">
        <button className="rounded-lg p-2 hover:bg-neutral-100">
          <Eye size={18} />
        </button>
      </td>
    </tr>
  );
}

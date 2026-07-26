export interface Transaction {
  id: string;
  reference: string;
  account: string;
  type: "Debit" | "Credit";
  amount: string;
  status: "Posted" | "Pending" | "Failed";
  createdAt: string;
}

export const transactions: Transaction[] = [
  {
    id: "1",
    reference: "JRN-2026-000012",
    account: "Cash Account",
    type: "Debit",
    amount: "$12,500.00",
    status: "Posted",
    createdAt: "09:34 AM",
  },
  {
    id: "2",
    reference: "JRN-2026-000013",
    account: "Revenue Account",
    type: "Credit",
    amount: "$6,820.00",
    status: "Pending",
    createdAt: "09:20 AM",
  },
  {
    id: "3",
    reference: "JRN-2026-000014",
    account: "Expense Account",
    type: "Debit",
    amount: "$2,300.00",
    status: "Failed",
    createdAt: "08:54 AM",
  },
  {
    id: "4",
    reference: "JRN-2026-000015",
    account: "Tax Liability",
    type: "Credit",
    amount: "$15,120.00",
    status: "Posted",
    createdAt: "08:22 AM",
  },
];

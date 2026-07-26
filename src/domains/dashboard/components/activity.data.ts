export type ActivityType = "Journal" | "Approval" | "User" | "Security";

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: ActivityType;
}

export const activities: Activity[] = [
  {
    id: "1",
    title: "Journal Entry Posted",
    description: "Journal JRN-2026-000123 has been successfully posted.",
    timestamp: "2 mins ago",
    type: "Journal",
  },
  {
    id: "2",
    title: "Approval Completed",
    description: "Monthly reconciliation approved by Finance Manager.",
    timestamp: "18 mins ago",
    type: "Approval",
  },
  {
    id: "3",
    title: "New User Created",
    description: "Operations Officer account has been created.",
    timestamp: "1 hour ago",
    type: "User",
  },
  {
    id: "4",
    title: "Successful Login",
    description: "Administrator signed in from Lagos Office.",
    timestamp: "2 hours ago",
    type: "Security",
  },
];

export type ServiceStatus = "Healthy" | "Warning" | "Critical";

export interface SystemService {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
}

export const systemServices: SystemService[] = [
  {
    id: "1",
    name: "API Gateway",
    description: "REST API",
    status: "Healthy",
  },
  {
    id: "2",
    name: "Database",
    description: "PostgreSQL Cluster",
    status: "Healthy",
  },
  {
    id: "3",
    name: "Authentication",
    description: "Identity Service",
    status: "Healthy",
  },
  {
    id: "4",
    name: "Notification",
    description: "Email Queue",
    status: "Warning",
  },
];

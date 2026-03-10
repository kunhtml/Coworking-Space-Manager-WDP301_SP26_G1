import { apiClient } from "./api";

export async function getTables() {
  return apiClient.get("/api/tables");
}
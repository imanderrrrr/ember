import type { TableStatus } from "./types";

export interface SearchResult {
  kind: "mesa" | "cliente";
  tableId: string;
  zoneId: string;
  primary: string;
  secondary: string;
  status: TableStatus;
}

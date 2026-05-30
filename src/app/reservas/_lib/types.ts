export interface ReservationPayload {
  tableId?: string | null;
  date: string;
  timeSlot: string;
  partySize: number;
  zoneName: string;
  tableLabel: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  occasion?: string | null;
  restrictions?: string[];
  notes?: string | null;
  mesero?: string | null;
}

export interface ReservationDTO {
  id: string;
  tableId: string | null;
  date: string;
  timeSlot: string;
  partySize: number;
  zoneName: string;
  tableLabel: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  occasion: string | null;
  restrictions: string[];
  notes: string | null;
  mesero: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

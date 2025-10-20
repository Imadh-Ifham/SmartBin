import axiosInstance from "../../config/axiosInstance";

// Backend response shape from Phase 2
export interface BackendInvoiceDto {
  id: string;
  amount: number;
  reason: string;
  status: string; // "Pending" | "Paid" | "Partially Paid" | "Refunded"
  createdAt: string;
  dueDate?: string | null;
}

export interface GetMyInvoicesParams {
  status?: "Pending" | "Paid" | "Partially Paid" | "Refunded";
}

export async function apiGetMyInvoices(params?: GetMyInvoicesParams) {
  const res = await axiosInstance.get<BackendInvoiceDto[]>(
    "/payments/me/invoices",
    { params }
  );
  return res.data;
}

export default {
  apiGetMyInvoices,
};

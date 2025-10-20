import axiosInstance from "../../config/axiosInstance";

export interface ProcessPaymentRequest {
  invoiceId: string;
  method: "Card" | "Bank" | "eWallet";
  amount: number;
  idempotencyKey?: string;
}

export interface ProcessPaymentResponse {
  clientSecret?: string;
  payment: {
    _id: string;
    invoiceId: string;
    amount: number;
    method: string;
    status: string;
    transactionId?: string;
  };
  receipt: { id: string; url: string };
}

export async function apiProcessPayment(
  payload: ProcessPaymentRequest,
  idempotencyKey?: string
) {
  const res = await axiosInstance.post<ProcessPaymentResponse>(
    "/payments/pay",
    payload,
    idempotencyKey
      ? { headers: { "Idempotency-Key": idempotencyKey } }
      : undefined
  );
  return res.data;
}

export default { apiProcessPayment };

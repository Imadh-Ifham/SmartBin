import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Invoice, Payment } from "../types/payment";
import { mockInvoices } from "../data/mockInvoices";

interface PaymentState {
  invoices: Invoice[];
  payments: Payment[];
}

const initialState: PaymentState = {
  invoices: mockInvoices,
  payments: [],
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    addPayment(state, action: PayloadAction<Payment>) {
      state.payments.push(action.payload);
      const inv = state.invoices.find((i) => i.id === action.payload.invoiceId);
      if (inv) inv.status = "paid";
    },
    setInvoices(state, action: PayloadAction<Invoice[]>) {
      state.invoices = action.payload;
    },
  },
});

export const { addPayment, setInvoices } = paymentSlice.actions;
export default paymentSlice.reducer;

// selectors
export const selectInvoices = (state: any) => state.payment?.invoices ?? [];
export const selectPayments = (state: any) => state.payment?.payments ?? [];

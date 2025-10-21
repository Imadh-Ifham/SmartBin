import { ReceiptService } from "../../services/receipt.service";

jest.mock("../../repositories/receipt.repository", () => {
  return {
    ReceiptRepository: jest.fn().mockImplementation(() => ({
      create: jest.fn(async (doc: any) => ({ _id: "rcpt_1", ...doc })),
    })),
  };
});

describe("ReceiptService", () => {
  it("generates receipt with optional data defaulting to {}", async () => {
    const svc = new ReceiptService();
    const res = await (svc as any).generate({
      invoiceId: "inv_1",
      paymentId: "pay_1",
      userId: "user_1",
      amount: 500,
    });
    expect(res.id).toBe("rcpt_1");
    expect(res.url).toBe("/api/payments/receipts/rcpt_1");
    expect(res.data.data).toEqual({});
  });

  it("passes through provided data", async () => {
    const svc = new ReceiptService();
    const res = await (svc as any).generate({
      invoiceId: "inv_1",
      paymentId: "pay_1",
      userId: "user_1",
      amount: 500,
      data: { a: 1 },
    });
    expect(res.data.data).toEqual({ a: 1 });
  });
});

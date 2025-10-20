import { NotificationService } from "../services/notification.service";

describe("NotificationService", () => {
  const svc = new NotificationService();
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  afterAll(() => {
    logSpy.mockRestore();
  });

  it("notifyPaymentSuccess logs success message", async () => {
    await svc.notifyPaymentSuccess({ invoiceId: "inv_1", amount: 500 });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Payment Success: Invoice inv_1 | Amount: 500")
    );
  });

  it("notifyPaymentFailure logs failure message", async () => {
    await svc.notifyPaymentFailure("inv_2");
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Payment Failure for Invoice inv_2")
    );
  });
});

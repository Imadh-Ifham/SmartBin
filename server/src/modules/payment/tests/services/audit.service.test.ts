import { AuditService } from "../../services/audit.service";

describe("AuditService", () => {
  it("log writes to console.info with payload", async () => {
    const svc = new AuditService();
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    await svc.log({
      actorId: "a",
      action: "DO",
      entityId: "E1",
      entityType: "X",
      details: { k: 1 },
    });
    expect(spy).toHaveBeenCalledWith(
      "[AUDIT]",
      expect.objectContaining({ actorId: "a", action: "DO" })
    );
    spy.mockRestore();
  });
});

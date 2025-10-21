import { SmartBinService } from "../services/smartBin.service";
import { Types } from "mongoose";

describe("SmartBinService.createBin", () => {
  afterEach(() => jest.restoreAllMocks());

  test("throws when type is missing", async () => {
    const svc = new SmartBinService({} as any);
    await expect(svc.createBin({} as any)).rejects.toThrow(
      "Bin type is required"
    );
  });

  test("throws when qrCode is missing", async () => {
    const svc = new SmartBinService({} as any);
    const payload = { type: new Types.ObjectId() } as any;
    await expect(svc.createBin(payload)).rejects.toThrow("QR code is required");
  });

  test("throws when type is invalid string", async () => {
    const svc = new SmartBinService({} as any);
    const payload = { type: "not-an-id", qrCode: new Types.ObjectId() } as any;
    await expect(svc.createBin(payload)).rejects.toThrow("Invalid bin type id");
  });

  test("throws when qrCode is invalid string", async () => {
    const svc = new SmartBinService({} as any);
    const payload = { type: new Types.ObjectId(), qrCode: "bad-qr" } as any;
    await expect(svc.createBin(payload)).rejects.toThrow("Invalid QR code id");
  });

  test("throws when limit is not a number", async () => {
    const svc = new SmartBinService({} as any);
    const payload = {
      type: new Types.ObjectId(),
      qrCode: new Types.ObjectId(),
      limit: "ten",
    } as any;
    await expect(svc.createBin(payload)).rejects.toThrow(
      "Limit must be a number"
    );
  });

  test("calls repo.create on valid payload", async () => {
    const mockRepo = {
      create: jest.fn().mockResolvedValue({ _id: "1" }),
    } as any;

    const svc = new SmartBinService(mockRepo);
    const payload = {
      type: new Types.ObjectId().toHexString(),
      qrCode: new Types.ObjectId().toHexString(),
      limit: 5,
    } as any;
    const res = await svc.createBin(payload);
    expect(mockRepo.create).toHaveBeenCalledWith(payload);
    expect(res).toEqual({ _id: "1" });
  });
});

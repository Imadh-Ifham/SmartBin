import request from "supertest";
import app from "../../../app"; // Adjust path if needed
import { WasteCollectionService } from "../services/waste-collection.service";
import { WasteCollectionRepository } from "../repositories/waste-collection.repository";
import { qrCodeService } from "../../smart-bin/services/qr-code.service";
import { smartBinService } from "../../smart-bin/services/smartBin.service";

jest.mock("../../smart-bin/services/qr-code.service");
jest.mock("../../smart-bin/services/smartBin.service");

const mockRepo = {
  create: jest.fn(),
};

describe("WasteCollectionService Unit", () => {
  let service: WasteCollectionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WasteCollectionService(mockRepo as any);
  });

  it("throws if code is missing", async () => {
    await expect(service.createByCode("")).rejects.toThrow(/code/);
  });

  it("throws if QR or bins not found", async () => {
    (qrCodeService.getByCode as jest.Mock).mockResolvedValue(null);
    await expect(service.createByCode("abc")).rejects.toThrow(
      /QR or bins not found/
    );
  });

  it("throws if no bins with non-zero weight", async () => {
    (qrCodeService.getByCode as jest.Mock).mockResolvedValue({
      qr: {},
      bins: [{ currentWeight: 0 }],
    });
    await expect(service.createByCode("abc")).rejects.toThrow(
      /non-zero weight/
    );
  });

  it("throws if no valid bin types", async () => {
    (qrCodeService.getByCode as jest.Mock).mockResolvedValue({
      qr: {},
      bins: [{ currentWeight: 5, type: "badid" }],
    });
    await expect(service.createByCode("abc")).rejects.toThrow(
      /valid bin types/
    );
  });

  it("creates and resets bins", async () => {
    (qrCodeService.getByCode as jest.Mock).mockResolvedValue({
      qr: { _id: "qrid" },
      bins: [
        { _id: "b1", currentWeight: 10, type: "507f1f77bcf86cd799439011" },
        { _id: "b2", currentWeight: 0, type: "507f1f77bcf86cd799439012" },
      ],
    });
    (mockRepo.create as jest.Mock).mockResolvedValue({ _id: "wcid" });
    (smartBinService.reportWeight as jest.Mock).mockResolvedValue({});
    const result = await service.createByCode("abc");
    expect(result).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalled();
    expect(smartBinService.reportWeight).toHaveBeenCalledWith("b1", 0);
  });
});

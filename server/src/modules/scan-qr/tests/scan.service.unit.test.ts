import { ScanService, IScanPayload } from "../services/scan.service";
import { qrCodeService } from "../../smart-bin/services/qr-code.service";
import { smartBinService } from "../../smart-bin/services/smartBin.service";
import { scanRepository } from "../repositories/scan.repository";

jest.mock("../../smart-bin/services/qr-code.service");
jest.mock("../../smart-bin/services/smartBin.service");
jest.mock("../repositories/scan.repository");

describe("ScanService Unit Tests", () => {
  let service: ScanService;
  const mockQrService = qrCodeService as jest.Mocked<typeof qrCodeService>;
  const mockBinService = smartBinService as jest.Mocked<typeof smartBinService>;
  const mockRepo = scanRepository as jest.Mocked<typeof scanRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ScanService(mockQrService, mockRepo, mockBinService);
  });

  describe("handleScan", () => {
    it("should throw error if code is missing", async () => {
      const payload: IScanPayload = { code: "", source: "camera" };
      await expect(service.handleScan(payload)).rejects.toThrow(
        "Scan code is required"
      );
    });

    it("should throw 404 if QR code not found", async () => {
      const payload: IScanPayload = { code: "INVALID-CODE", source: "camera" };
      mockQrService.getByCode.mockResolvedValue(null);

      await expect(service.handleScan(payload)).rejects.toEqual({
        status: 404,
        message: "QR Code not found",
      });
    });

    it("should throw 400 if QR subscription is inactive", async () => {
      const payload: IScanPayload = { code: "WP-12345-C", source: "camera" };
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Inactive" },
        bins: [],
      };
      mockQrService.getByCode.mockResolvedValue(qrData as any);
      mockQrService.checkSubscription.mockResolvedValue(false);

      await expect(service.handleScan(payload)).rejects.toEqual({
        status: 400,
        message: "QR Code subscription inactive",
      });
    });

    it("should return QR data when scan is successful", async () => {
      const payload: IScanPayload = { code: "WP-12345-C", source: "camera" };
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [{ _id: "bin1", type: "plastic" }],
      };
      mockQrService.getByCode.mockResolvedValue(qrData as any);
      mockQrService.checkSubscription.mockResolvedValue(true);
      mockBinService.checkOverweightBins.mockResolvedValue({
        hasOverweight: false,
        overweightBins: [],
      } as any);
      mockRepo.save.mockResolvedValue({} as any);

      const result = await service.handleScan(payload);

      expect(result).toEqual({
        ...qrData,
        overweight: null,
      });
      expect(mockRepo.save).toHaveBeenCalledWith(payload);
      expect(mockQrService.getByCode).toHaveBeenCalledWith("WP-12345-C");
      expect(mockQrService.checkSubscription).toHaveBeenCalledWith("Active");
      expect(mockBinService.checkOverweightBins).toHaveBeenCalledWith("qr1");
    });

    it("should call recordScan with payload", async () => {
      const payload: IScanPayload = {
        code: "WP-12345-C",
        source: "mobile",
        userId: "user123",
      };
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [],
      };
      mockQrService.getByCode.mockResolvedValue(qrData as any);
      mockQrService.checkSubscription.mockResolvedValue(true);
      mockBinService.checkOverweightBins.mockResolvedValue({
        hasOverweight: false,
        overweightBins: [],
      } as any);
      mockRepo.save.mockResolvedValue({} as any);

      await service.handleScan(payload);

      expect(mockRepo.save).toHaveBeenCalledWith(payload);
    });

    it("should include overweight status when bins exceed limit", async () => {
      const payload: IScanPayload = { code: "WP-12345-C", source: "camera" };
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [{ _id: "bin1", type: "plastic", currentWeight: 15, limit: 10 }],
      };
      const overweightCheck = {
        hasOverweight: true,
        overweightBins: [
          {
            id: "bin1",
            type: "plastic",
            currentWeight: 15,
            limit: 10,
            exceededBy: 5,
          },
        ],
      };

      mockQrService.getByCode.mockResolvedValue(qrData as any);
      mockQrService.checkSubscription.mockResolvedValue(true);
      mockBinService.checkOverweightBins.mockResolvedValue(
        overweightCheck as any
      );
      mockRepo.save.mockResolvedValue({} as any);

      const result = await service.handleScan(payload);

      expect(result).toEqual({
        ...qrData,
        overweight: {
          status: "OVERWEIGHT_NOT_PAID",
          message: "Some bins exceed their weight limit. Payment required.",
          bins: overweightCheck.overweightBins,
        },
      });
      expect(mockBinService.checkOverweightBins).toHaveBeenCalledWith("qr1");
    });
  });

  describe("recordScan", () => {
    it("should save scan payload via repository", async () => {
      const payload: IScanPayload = { code: "WP-12345-C", source: "kiosk" };
      mockRepo.save.mockResolvedValue({} as any);

      await service.recordScan(payload);

      expect(mockRepo.save).toHaveBeenCalledWith(payload);
    });
  });
});

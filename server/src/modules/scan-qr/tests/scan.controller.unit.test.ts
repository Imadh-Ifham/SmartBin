import { Request, Response } from "express";
import { ScanController } from "../controllers/scan.controller";
import { scanService } from "../services/scan.service";

jest.mock("../services/scan.service");

describe("ScanController Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe("scan", () => {
    it("should return 400 if code is missing", async () => {
      mockReq = { body: { source: "camera" } };

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.any(Array),
      });
    });

    it("should return 400 if code is empty string", async () => {
      mockReq = { body: { code: "", source: "camera" } };

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.any(Array),
      });
    });

    it("should return QR data on successful scan", async () => {
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [{ _id: "bin1", type: "plastic" }],
      };
      mockReq = { body: { code: "WP-12345-C", source: "camera" } };
      (scanService.handleScan as jest.Mock).mockResolvedValue(qrData);

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(scanService.handleScan).toHaveBeenCalledWith({
        code: "WP-12345-C",
        source: "camera",
        userId: "",
      });
      expect(jsonMock).toHaveBeenCalledWith({ result: qrData });
    });

    it("should use default source if not provided", async () => {
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [],
      };
      mockReq = { body: { code: "WP-12345-C" } };
      (scanService.handleScan as jest.Mock).mockResolvedValue(qrData);

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(scanService.handleScan).toHaveBeenCalledWith({
        code: "WP-12345-C",
        source: "camera",
        userId: "",
      });
    });

    it("should pass userId if provided", async () => {
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [],
      };
      mockReq = {
        body: { code: "WP-12345-C", source: "mobile", userId: "user123" },
      };
      (scanService.handleScan as jest.Mock).mockResolvedValue(qrData);

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(scanService.handleScan).toHaveBeenCalledWith({
        code: "WP-12345-C",
        source: "mobile",
        userId: "user123",
      });
    });

    it("should return 404 if QR code not found", async () => {
      mockReq = { body: { code: "INVALID-CODE", source: "camera" } };
      (scanService.handleScan as jest.Mock).mockRejectedValue({
        status: 404,
        message: "QR Code not found",
      });

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "QR Code not found",
        details: undefined,
      });
    });

    it("should return 400 if subscription is inactive", async () => {
      mockReq = { body: { code: "WP-12345-C", source: "camera" } };
      (scanService.handleScan as jest.Mock).mockRejectedValue({
        status: 400,
        message: "QR Code subscription inactive",
      });

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "QR Code subscription inactive",
        details: undefined,
      });
    });

    it("should return 500 on generic error", async () => {
      mockReq = { body: { code: "WP-12345-C", source: "camera" } };
      (scanService.handleScan as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      await ScanController.scan(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Unexpected error",
        details: undefined,
      });
    });
  });
});

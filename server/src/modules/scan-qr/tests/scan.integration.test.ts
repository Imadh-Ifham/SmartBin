import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { ScanController } from "../controllers/scan.controller";
import { scanService } from "../services/scan.service";

jest.mock("../services/scan.service");

const app = express();
app.use(bodyParser.json());
app.post("/api/scan", ScanController.scan);

describe("Scan Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/scan", () => {
    it("should return 400 if code is missing", async () => {
      const res = await request(app)
        .post("/api/scan")
        .send({ source: "camera" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toBeDefined();
    });

    it("should return 400 if code is empty", async () => {
      const res = await request(app).post("/api/scan").send({ code: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("should return 404 if QR code not found", async () => {
      (scanService.handleScan as jest.Mock).mockRejectedValue({
        status: 404,
        message: "QR Code not found",
      });

      const res = await request(app)
        .post("/api/scan")
        .send({ code: "INVALID-CODE" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("QR Code not found");
    });

    it("should return 400 if subscription is inactive", async () => {
      (scanService.handleScan as jest.Mock).mockRejectedValue({
        status: 400,
        message: "QR Code subscription inactive",
      });

      const res = await request(app)
        .post("/api/scan")
        .send({ code: "WP-12345-C" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("QR Code subscription inactive");
    });

    it("should return 200 with QR data on success", async () => {
      const qrData = {
        qr: {
          _id: "qr1",
          code: "WP-12345-C",
          status: "Active",
          address: "123 Main St",
          province: "Western Province",
          city: "Colombo",
        },
        bins: [
          { _id: "bin1", type: "507f1f77bcf86cd799439011", currentWeight: 10 },
        ],
      };
      (scanService.handleScan as jest.Mock).mockResolvedValue(qrData);

      const res = await request(app)
        .post("/api/scan")
        .send({ code: "WP-12345-C", source: "mobile" });

      expect(res.status).toBe(200);
      expect(res.body.result).toEqual(qrData);
      expect(scanService.handleScan).toHaveBeenCalledWith({
        code: "WP-12345-C",
        source: "mobile",
        userId: "",
      });
    });

    it("should use default source if not provided", async () => {
      const qrData = {
        qr: { _id: "qr1", code: "WP-12345-C", status: "Active" },
        bins: [],
      };
      (scanService.handleScan as jest.Mock).mockResolvedValue(qrData);

      const res = await request(app)
        .post("/api/scan")
        .send({ code: "WP-12345-C" });

      expect(res.status).toBe(200);
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
      (scanService.handleScan as jest.Mock).mockResolvedValue(qrData);

      const res = await request(app)
        .post("/api/scan")
        .send({ code: "WP-12345-C", source: "kiosk", userId: "user123" });

      expect(res.status).toBe(200);
      expect(scanService.handleScan).toHaveBeenCalledWith({
        code: "WP-12345-C",
        source: "kiosk",
        userId: "user123",
      });
    });

    it("should return 500 on unexpected errors", async () => {
      (scanService.handleScan as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      const res = await request(app)
        .post("/api/scan")
        .send({ code: "WP-12345-C" });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Database connection failed");
    });
  });
});

import { ScanRepository } from "../repositories/scan.repository";
import { ScanEvent } from "../models/scan.model";
import { IScanPayload } from "../services/scan.service";

jest.mock("../models/scan.model");

describe("ScanRepository Unit Tests", () => {
  let repository: ScanRepository;
  const mockSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ScanRepository();
    (ScanEvent as any).mockImplementation((doc: any) => ({
      ...doc,
      save: mockSave,
    }));
  });

  describe("save", () => {
    it("should create and save a scan event", async () => {
      const payload: IScanPayload = {
        code: "WP-12345-C",
        source: "camera",
        userId: "user123",
      };
      const mockSavedDoc = { _id: "scan1", ...payload };
      mockSave.mockResolvedValue(mockSavedDoc);

      const result = await repository.save(payload);

      expect(ScanEvent).toHaveBeenCalledWith(payload);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedDoc);
    });

    it("should save scan event without userId", async () => {
      const payload: IScanPayload = {
        code: "WP-67890-C",
        source: "mobile",
      };
      const mockSavedDoc = { _id: "scan2", ...payload };
      mockSave.mockResolvedValue(mockSavedDoc);

      const result = await repository.save(payload);

      expect(ScanEvent).toHaveBeenCalledWith(payload);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedDoc);
    });

    it("should handle save errors", async () => {
      const payload: IScanPayload = {
        code: "WP-12345-C",
        source: "camera",
      };
      const error = new Error("Database error");
      mockSave.mockRejectedValue(error);

      await expect(repository.save(payload)).rejects.toThrow("Database error");
    });
  });
});

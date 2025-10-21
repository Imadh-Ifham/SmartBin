import { Request, Response } from "express";
import { WasteCollectionService } from "../services/waste-collection.service";

const service = new WasteCollectionService();

/**
 * Controller for handling new waste collection creation.
 * Accepts only 'code', fetches bins/qr, collects non-zero bins, updates waste-collection DB, and resets bin weights.
 *
 * @route POST /api/waste-collections
 * @body { code: string }
 */
export const createWasteCollection = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      return res
        .status(400)
        .json({ message: "'code' is required and must be a string." });
    }
    const doc = await service.createByCode(code);
    res.status(201).json({ message: "Created", item: doc });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to create" });
  }
};

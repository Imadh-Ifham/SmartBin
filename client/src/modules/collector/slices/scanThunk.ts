import { createAsyncThunk } from "@reduxjs/toolkit";
import { scanQRCodeApi } from "../../../api/scan/scan.api";
import { createWasteCollectionApi } from "../../../api/waste-collection/waste-collection.api";
import type { ScanPayload } from "../types/scan";

/**
 * Thunk to scan a QR code
 * Handles the full scan flow: validation, API call, and error handling
 */
export const scanQRCode = createAsyncThunk(
  "scan/scanQRCode",
  async (payload: ScanPayload, { rejectWithValue }) => {
    try {
      if (!payload.code || !payload.code.trim()) {
        throw new Error("Scan code is required");
      }

      const data = await scanQRCodeApi(payload);
      return data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Failed to scan QR code";

      // Return structured error with status if available
      return rejectWithValue({
        message: errorMessage,
        status: err?.response?.status,
      });
    }
  }
);

/**
 * Thunk to mark bins as collected
 * Creates a waste collection record and resets bin weights
 */
export const markBinsCollected = createAsyncThunk(
  "scan/markBinsCollected",
  async (code: string, { rejectWithValue }) => {
    try {
      if (!code || !code.trim()) {
        throw new Error("Code is required");
      }

      const data = await createWasteCollectionApi({ code });
      return data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Failed to mark bins as collected";

      return rejectWithValue({
        message: errorMessage,
        status: err?.response?.status,
      });
    }
  }
);

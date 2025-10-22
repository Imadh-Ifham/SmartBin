import { createAsyncThunk } from "@reduxjs/toolkit";
import { scanQRCodeApi } from "../../../api/scan/scan.api";
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

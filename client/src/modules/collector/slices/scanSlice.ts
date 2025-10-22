import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../app/store";
import type { ScanState, ScanResult, QRData, BinData } from "../types/scan";
import { scanQRCode } from "./scanThunk";

const initialState: ScanState = {
  currentScan: null,
  scanHistory: [],
  loading: false,
  error: null,
  lastScannedCode: null,
};

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    /**
     * Clear the current scan result
     */
    clearCurrentScan: (state) => {
      state.currentScan = null;
      state.error = null;
    },

    /**
     * Clear scan error
     */
    clearScanError: (state) => {
      state.error = null;
    },

    /**
     * Clear scan history
     */
    clearScanHistory: (state) => {
      state.scanHistory = [];
    },

    /**
     * Add a scan to history manually (if needed)
     */
    addToHistory: (state, action: PayloadAction<ScanResult>) => {
      // Prevent duplicates based on QR code
      const exists = state.scanHistory.some(
        (scan) => scan.qr.code === action.payload.qr.code
      );
      if (!exists) {
        state.scanHistory.unshift(action.payload);
        // Keep only last 50 scans
        if (state.scanHistory.length > 50) {
          state.scanHistory = state.scanHistory.slice(0, 50);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle scanQRCode thunk
      .addCase(scanQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        scanQRCode.fulfilled,
        (state, action: PayloadAction<ScanResult>) => {
          state.loading = false;
          state.currentScan = action.payload;
          state.lastScannedCode = action.payload.qr.code;

          // Add to history (prevent duplicates)
          const exists = state.scanHistory.some(
            (scan) => scan.qr.code === action.payload.qr.code
          );
          if (!exists) {
            state.scanHistory.unshift(action.payload);
            // Keep only last 50 scans
            if (state.scanHistory.length > 50) {
              state.scanHistory = state.scanHistory.slice(0, 50);
            }
          }
        }
      )
      .addCase(scanQRCode.rejected, (state, action) => {
        state.loading = false;
        state.currentScan = null;

        // Handle structured error or fallback to generic message
        if (action.payload && typeof action.payload === "object") {
          const error = action.payload as { message: string; status?: number };
          state.error = error.message;
        } else {
          state.error = action.error.message || "Failed to scan QR code";
        }
      });
  },
});

// Actions
export const {
  clearCurrentScan,
  clearScanError,
  clearScanHistory,
  addToHistory,
} = scanSlice.actions;

// Selectors
export const selectCurrentScan = (state: RootState) => state.scan?.currentScan;
export const selectScanQR = (state: RootState): QRData | null =>
  state.scan?.currentScan?.qr || null;
export const selectScanBins = (state: RootState): BinData[] =>
  state.scan?.currentScan?.bins || [];
export const selectScanHistory = (state: RootState) =>
  state.scan?.scanHistory || [];
export const selectScanLoading = (state: RootState) =>
  state.scan?.loading || false;
export const selectScanError = (state: RootState) => state.scan?.error;
export const selectLastScannedCode = (state: RootState) =>
  state.scan?.lastScannedCode;

export default scanSlice.reducer;

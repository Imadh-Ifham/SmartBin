import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Bin, BinType, QR, QRWithBins } from "../types/bin";
import { fetchQRWithBinsApi } from "../../../api/bin/bin.api";
import { fetchBinTypesApi } from "../../../api/bin/bin.api";
// Thunk to fetch BinTypes
export const fetchBinTypes = createAsyncThunk(
  "bins/fetchBinTypes",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchBinTypesApi();
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch bin types"
      );
    }
  }
);
import type { RootState } from "../../../app/store";

// Usage: AppDispatch(fetchQRWithBins(qrCode))
export const fetchQRWithBins = createAsyncThunk(
  "bins/fetchQRWithBins",
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const data = await fetchQRWithBinsApi(qrCode);
      console.log("Fetched QRWithBins data:", data);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch QR/bin data"
      );
    }
  }
);

interface BinState {
  qr: QR | null;
  bins: Bin[];
  binTypes: BinType[];
  loading: boolean;
  error: string | null;
}

const initialState: BinState = {
  qr: null,
  bins: [],
  binTypes: [],
  loading: false,
  error: null,
};

const binSlice = createSlice({
  name: "bins",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQRWithBins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchQRWithBins.fulfilled,
        (state, action: PayloadAction<QRWithBins>) => {
          state.bins = action.payload.bins;
          state.qr = action.payload.qr;
          state.loading = false;
        }
      )
      .addCase(fetchQRWithBins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch bins";
      })
      // Handle fetchBinTypes thunk
      .addCase(fetchBinTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBinTypes.fulfilled,
        (state, action: PayloadAction<BinType[]>) => {
          state.binTypes = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchBinTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch bin types";
      });
  },
});

export const selectBins = (state: RootState) => state.bin.bins;
export const selectQR = (state: RootState) => state.bin.qr;
export const selectBinTypes = (state: RootState) => state.bin.binTypes;
export const selectBinsLoading = (state: RootState) => state.bin.loading;
export const selectBinsError = (state: RootState) => state.bin.error;

export default binSlice.reducer;

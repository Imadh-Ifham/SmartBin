import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchQRWithBinsApi,
  fetchBinTypesApi,
  updateBinWeightApi,
} from "../../../api/bin/bin.api";

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

// Thunk to update the weight of a bin
export const updateBinWeight = createAsyncThunk(
  "bins/updateBinWeight",
  async (
    { binId, weight }: { binId: string; weight: number },
    { rejectWithValue }
  ) => {
    try {
      const updatedBin = await updateBinWeightApi(binId, weight);
      return updatedBin;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update bin weight"
      );
    }
  }
);

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

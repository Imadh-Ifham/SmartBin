import { createAsyncThunk } from "@reduxjs/toolkit";
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

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { BinType } from "../types/bin";
import type { RootState } from "../../../app/store";
import { fetchBinTypes } from "./collectorThunk";

interface CollectorState {
  binTypes: BinType[];
  loading: boolean;
  error: string | null;
}

const initialState: CollectorState = {
  binTypes: [],
  loading: false,
  error: null,
};

const collectorSlice = createSlice({
  name: "collector",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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

export const selectBinTypes = (state: RootState) => state.collector.binTypes;

export default collectorSlice.reducer;

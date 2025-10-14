import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Bin {
  id: number;
  lat: number;
  lng: number;
  status: "pending" | "collected" | "skipped";
  name?: string;
}

interface CollectorState {
  bins: Bin[];
}

const initialState: CollectorState = {
  // small example seed data — move to async load in the future
  bins: [
    { id: 1, lat: 6.9344, lng: 79.8428, status: "pending", name: "Bin A" },
    { id: 2, lat: 6.94, lng: 79.86, status: "pending", name: "Bin B" },
    { id: 3, lat: 6.95, lng: 79.87, status: "pending", name: "Bin C" },
  ],
};

const collectorSlice = createSlice({
  name: "collector",
  initialState,
  reducers: {
    setBins(state, action: PayloadAction<Bin[]>) {
      state.bins = action.payload;
    },
    addBin(state, action: PayloadAction<Bin>) {
      state.bins.push(action.payload);
    },
    markCollected(state, action: PayloadAction<number>) {
      const id = action.payload;
      const b = state.bins.find((x) => x.id === id);
      if (b) b.status = "collected";
    },
    skipBin(state, action: PayloadAction<number>) {
      const id = action.payload;
      const b = state.bins.find((x) => x.id === id);
      if (b) b.status = "skipped";
    },
    updateBin(state, action: PayloadAction<Bin>) {
      const updated = action.payload;
      const idx = state.bins.findIndex((x) => x.id === updated.id);
      if (idx !== -1) state.bins[idx] = updated;
    },
  },
});

export const { setBins, addBin, markCollected, skipBin, updateBin } =
  collectorSlice.actions;

export default collectorSlice.reducer;

// Selectors
export const selectBins = (state: any) => state.collector?.bins ?? [];

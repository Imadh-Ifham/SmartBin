import { combineReducers } from "@reduxjs/toolkit";
import collectorReducer from "../modules/collector/slices/collectorSlice";

const rootReducer = combineReducers({
  collector: collectorReducer,
});

export type RootReducer = typeof rootReducer;

export default rootReducer;

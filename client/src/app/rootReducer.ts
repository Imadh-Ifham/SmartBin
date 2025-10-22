import { combineReducers } from "@reduxjs/toolkit";
import collectorReducer from "../modules/collector/slices/collectorSlice";
import paymentReducer from "../modules/payment/slices/paymentSlice";
import binReducer from "../modules/smart-bin/slices/binSlice";
import scanReducer from "../modules/collector/slices/scanSlice";

const rootReducer = combineReducers({
  collector: collectorReducer,
  payment: paymentReducer,
  bin: binReducer,
  scan: scanReducer,
});

export type RootReducer = typeof rootReducer;

export default rootReducer;

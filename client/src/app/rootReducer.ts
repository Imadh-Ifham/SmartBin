import { combineReducers } from "@reduxjs/toolkit";
import collectorReducer from "../modules/collector/slices/collectorSlice";
import paymentReducer from "../modules/payment/slices/paymentSlice";
import binReducer from "../modules/smart-bin/slices/binSlice";

const rootReducer = combineReducers({
  collector: collectorReducer,
  payment: paymentReducer,
  bin: binReducer,
});

export type RootReducer = typeof rootReducer;

export default rootReducer;

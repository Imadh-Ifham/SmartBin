import { combineReducers } from "@reduxjs/toolkit";
import collectorReducer from "../modules/collector/slices/collectorSlice";
import paymentReducer from "../modules/payment/slices/paymentSlice";

const rootReducer = combineReducers({
  collector: collectorReducer,
  payment: paymentReducer,
});

export type RootReducer = typeof rootReducer;

export default rootReducer;

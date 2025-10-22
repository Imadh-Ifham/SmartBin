export interface ScanPayload {
  code: string;
  source?: string;
  userId?: string;
}

export interface QRData {
  _id: string;
  code: string;
  qrUrl: string;
  userId: string;
  address: string;
  province: string;
  city: string;
  status: "Active" | "Inactive" | "Suspended";
  description?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface BinData {
  _id: string;
  type: string;
  qrCode: string;
  currentWeight: number;
  limit?: number;
}

export interface OverweightBinInfo {
  id: string;
  type: string;
  currentWeight: number;
  limit: number;
  exceededBy: number;
}

export interface OverweightStatus {
  status: "OVERWEIGHT_NOT_PAID";
  message: string;
  bins: OverweightBinInfo[];
}

export interface ScanResult {
  qr: QRData;
  bins: BinData[];
  overweight?: OverweightStatus | null;
}

export interface ScanState {
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  loading: boolean;
  error: string | null;
  lastScannedCode: string | null;
}

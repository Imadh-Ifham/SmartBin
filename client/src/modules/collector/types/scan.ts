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

export interface ScanResult {
  qr: QRData;
  bins: BinData[];
}

export interface ScanState {
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  loading: boolean;
  error: string | null;
  lastScannedCode: string | null;
}

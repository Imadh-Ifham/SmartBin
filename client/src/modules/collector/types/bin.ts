export interface QR {
  _id: string;
  code: string;
  qrUrl: string;
  userId: string;
  address: string;
  province: string;
  city: string;
  status: "Active" | "InMaintenance" | "Decommissioned";
}

export interface Bin {
  _id: string;
  qrCode: string;
  type: string;
  currentWeight: number;
  limit: number;
}

export interface BinType {
  _id: string;
  name: string;
}

export interface QRWithBins {
  qr: QR;
  bins: Bin[];
}

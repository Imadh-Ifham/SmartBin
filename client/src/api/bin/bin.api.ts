import type { BinType } from "../../modules/smart-bin/types/bin";
// Fetch all BinTypes
export async function fetchBinTypesApi(): Promise<BinType[]> {
  const res = await axiosInstance.get<any>("bin-types");
  return res.data.items;
}
import axiosInstance from "../../config/axiosInstance";
import type { QRWithBins } from "../../modules/smart-bin/types/bin";

export async function fetchQRWithBinsApi(qrCode: string): Promise<QRWithBins> {
  const res = await axiosInstance.get<any>(`qrs/${qrCode}`);
  return res.data.item;
}

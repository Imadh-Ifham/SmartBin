import type { Bin } from "../../modules/smart-bin/types/bin";
import type { BinType } from "../../modules/smart-bin/types/bin";
import axiosInstance from "../../config/axiosInstance";
import type { QRWithBins } from "../../modules/smart-bin/types/bin";

// Update the weight of a bin by ID
export async function updateBinWeightApi(
  binId: string,
  weight: number
): Promise<Bin> {
  const res = await axiosInstance.post<any>(`bins/${binId}/report-weight`, {
    weight,
  });
  return res.data.bin;
}

// Fetch all BinTypes
export async function fetchBinTypesApi(): Promise<BinType[]> {
  const res = await axiosInstance.get<any>("bin-types");
  return res.data.items;
}

export async function fetchQRWithBinsApi(qrCode: string): Promise<QRWithBins> {
  const res = await axiosInstance.get<any>(`qrs/${qrCode}`);
  return res.data.item;
}

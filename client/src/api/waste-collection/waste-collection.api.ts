import axiosInstance from "../../config/axiosInstance";

export interface WasteCollectionPayload {
  code: string;
}

export interface WasteCollectionResponse {
  message: string;
  item: {
    _id: string;
    code: string;
    wasteTypes: Array<{
      type: string;
      weight: number;
      timestamp: string;
    }>;
    collected: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * API call to create a waste collection record
 * POST /api/waste-collections
 * @param payload - Object containing the QR code
 * @returns Waste collection record
 */
export async function createWasteCollectionApi(
  payload: WasteCollectionPayload
): Promise<WasteCollectionResponse> {
  const res = await axiosInstance.post<WasteCollectionResponse>(
    "/waste-collections",
    payload
  );
  return res.data;
}

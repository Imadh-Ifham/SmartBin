import axiosInstance from "../../config/axiosInstance";
import type {
  ScanPayload,
  ScanResult,
} from "../../modules/collector/types/scan";

/**
 * API call to scan a QR code
 * POST /api/scan
 * @param payload - Scan details (code, source, userId)
 * @returns QR and bins data
 */
export async function scanQRCodeApi(payload: ScanPayload): Promise<ScanResult> {
  const res = await axiosInstance.post<{ result: ScanResult }>(
    "scans/",
    payload
  );
  return res.data.result;
}

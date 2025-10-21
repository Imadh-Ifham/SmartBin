import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSelector } from "react-redux";
import { selectQR } from "../slices/binSlice";

const QRPanel: React.FC<{ code: string }> = ({ code }) => {
  const qr = useSelector(selectQR);
  const qrUrl = qr?.qrUrl;
  return (
    <div className="w-full flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-lg gap-4">
      <h2 className="text-2xl font-bold text-gray-800">Smart Bin Code</h2>
      <p className="text-gray-600 font-medium">{code}</p>
      <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-[180px] h-[180px] object-contain"
          />
        ) : (
          <QRCodeSVG value={code} size={180} />
        )}
      </div>
      <p className="text-sm text-gray-500 mt-1">Scan to identify bins</p>
    </div>
  );
};

export default QRPanel;

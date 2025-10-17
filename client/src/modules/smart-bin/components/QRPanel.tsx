import React from "react";
import { QRCodeSVG } from "qrcode.react";

const QRPanel: React.FC<{ code: string }> = ({ code }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-lg gap-4">
      <h2 className="text-2xl font-bold text-gray-800">Smart Bin Code</h2>
      <p className="text-gray-600 font-medium">{code}</p>
      <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
        <QRCodeSVG value={code} size={180} />
      </div>
      <p className="text-sm text-gray-500 mt-1">Scan to identify bins</p>
    </div>
  );
};

export default QRPanel;

import React, { useState } from "react";
import BinCard from "../components/BinCard";
import QRPanel from "../components/QRPanel";
import WeightForm from "../components/WeightForm";

interface Bin {
  id: number;
  type: string;
  currentWeight: number;
  limit: number;
}

const SmartBin: React.FC = () => {
  const [bins, setBins] = useState<Bin[]>([
    { id: 1, type: "Plastic", currentWeight: 12, limit: 20 },
    { id: 2, type: "Glass", currentWeight: 18, limit: 25 },
    { id: 3, type: "Metal", currentWeight: 5, limit: 15 },
    { id: 4, type: "Organic", currentWeight: 9, limit: 10 },
    { id: 5, type: "Paper", currentWeight: 3, limit: 10 },
    { id: 6, type: "E-Waste", currentWeight: 7, limit: 10 },
  ]);

  const [form, setForm] = useState({ id: 1, weight: 0 });

  const binCode = "SALOBIN-4031A"; // fixed shared code

  const updateWeight = () => {
    setBins((prev) =>
      prev.map((bin) =>
        bin.id === form.id ? { ...bin, currentWeight: form.weight } : bin
      )
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center">
      {/* --- TOP SECTION --- */}
      <div className="w-full flex flex-col md:flex-row h-auto md:h-[80vh] px-6 md:px-12 py-8 md:py-12 gap-8">
        {/* LEFT: BIN GRID */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {bins.map((bin) => (
            <BinCard bin={bin} key={bin.id} />
          ))}
        </div>

        {/* RIGHT: QR + BIN CODE */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg">
          <QRPanel code={binCode} />
        </div>
      </div>

      {/* --- SCROLL FORM SECTION --- */}
      <div className="w-full flex justify-center px-6 md:px-12 pb-12">
        <WeightForm
          bins={bins}
          form={form}
          setForm={setForm}
          onUpdate={updateWeight}
        />
      </div>
    </div>
  );
};

export default SmartBin;

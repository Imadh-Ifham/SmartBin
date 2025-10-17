import React from "react";

interface Bin {
  id: number;
  type: string;
  currentWeight: number;
  limit: number;
}

const getProgressColor = (bin: Bin) => {
  const percent = (bin.currentWeight / bin.limit) * 100;
  if (percent > 100) return "bg-red-600";
  if (percent > 80) return "bg-yellow-500";
  return "bg-green-600";
};

const BinCard: React.FC<{ bin: Bin }> = ({ bin }) => {
  const percent = (bin.currentWeight / bin.limit) * 100;
  const exceeded = percent > 100;

  return (
    <div className="relative w-44 h-56 flex flex-col items-center">
      {/* Bin top lid */}
      <div className="w-3/4 h-3 bg-gray-700 rounded-t-md"></div>

      {/* Bin body */}
      <div className="relative bg-gray-300 w-full h-full rounded-b-lg border-2 border-gray-500 flex flex-col items-center justify-between p-2">
        {/* Bin type label */}
        <div className="text-center mt-1">
          <h3 className="text-base font-semibold text-gray-800 leading-tight">
            {bin.type}
          </h3>
          <p className="text-xs text-gray-500">#{bin.id}</p>
        </div>

        {/* Progress bar inside the bin */}
        <div className="relative w-14 h-28 bg-gray-100 border border-gray-400 rounded-md overflow-hidden mt-2">
          <div
            className={`${getProgressColor(
              bin
            )} absolute bottom-0 left-0 w-full transition-all duration-500`}
            style={{ height: `${Math.min(percent, 100)}%` }}
          ></div>
        </div>

        {/* Weight info below */}
        <div className="text-xs text-center mt-2">
          <p className="text-gray-700 font-medium">
            {bin.currentWeight}kg / {bin.limit}kg
          </p>
          {exceeded && (
            <p className="text-red-600 font-semibold">
              +{(bin.currentWeight - bin.limit).toFixed(1)}kg
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BinCard;

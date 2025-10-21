import React from "react";
import type { Bin } from "../../smart-bin/types/bin";
import { Scale } from "lucide-react";

const BinCard: React.FC<{ bin: Bin }> = ({ bin }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
      <div>
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-gray-500" />
          <span className="font-medium">{bin.type}</span>
        </div>
        <div className="text-sm text-gray-500">Limit: {bin.limit} kg</div>
      </div>
      <div className="text-right">
        {(() => {
          const exceeded = bin.currentWeight > bin.limit;
          const percentage = Math.min(
            bin.limit ? (bin.currentWeight / bin.limit) * 100 : 0,
            100
          );
          const exceededBy = exceeded
            ? (bin.currentWeight - bin.limit).toFixed(1)
            : null;
          return (
            <>
              <span
                className={`font-semibold ${
                  exceeded
                    ? "text-red-600"
                    : bin.currentWeight >= bin.limit * 0.9
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {bin.currentWeight} kg
              </span>
              {exceeded && (
                <div className="text-xs text-red-600 mt-0.5">
                  Exceeded by {exceededBy} kg
                </div>
              )}
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className={`h-2 rounded-full ${
                    exceeded
                      ? "bg-red-600"
                      : bin.currentWeight >= bin.limit * 0.9
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default BinCard;

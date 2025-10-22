import React from "react";
import type { Bin } from "../../smart-bin/types/bin";
import type { BinData } from "../types/scan";
import { Scale } from "lucide-react";
import { useSelector } from "react-redux";
import { selectBinTypes } from "../slices/collectorSlice";

const BinCard: React.FC<{ bin: Bin | BinData }> = ({ bin }) => {
  const binLimit = bin.limit || 0;

  const binTypes = useSelector(selectBinTypes);

  return (
    <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
      <div>
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-gray-500" />
          <span className="font-medium">
            {binTypes.find((type) => type._id === bin.type)?.name || bin.type}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Limit: {binLimit > 0 ? `${binLimit} unit` : "N/A"}
        </div>
      </div>
      <div className="text-right">
        {(() => {
          const exceeded = binLimit > 0 && bin.currentWeight > binLimit;
          const warningThreshold = binLimit * 0.9;
          const percentage = Math.min(
            binLimit > 0 ? (bin.currentWeight / binLimit) * 100 : 0,
            100
          );
          const exceededBy = exceeded
            ? (bin.currentWeight - binLimit).toFixed(1)
            : null;
          return (
            <>
              <span
                className={`font-semibold ${
                  exceeded
                    ? "text-red-600"
                    : binLimit > 0 && bin.currentWeight >= warningThreshold
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {bin.currentWeight} unit
              </span>
              {exceeded && (
                <div className="text-xs text-red-600 mt-0.5">
                  Exceeded by {exceededBy} unit
                </div>
              )}
              {binLimit > 0 && (
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      exceeded
                        ? "bg-red-600"
                        : bin.currentWeight >= warningThreshold
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default BinCard;

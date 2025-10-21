import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectBins,
  selectBinsLoading,
  selectBinsError,
  selectBinTypes,
} from "../slices/binSlice";
import { updateBinWeight } from "../slices/binThunk";
import type { AppDispatch } from "../../../app/store";

const WeightForm: React.FC = () => {
  const bins = useSelector(selectBins);
  const binTypes = useSelector(selectBinTypes);
  const loading = useSelector(selectBinsLoading);
  const error = useSelector(selectBinsError);
  const dispatch = useDispatch<AppDispatch>();

  // Default to first bin if available
  const [form, setForm] = useState<{ id: string; weight: number }>(() => {
    const firstBin = bins[0];
    return {
      id: firstBin ? firstBin._id : "",
      weight: firstBin ? firstBin.currentWeight : 0,
    };
  });

  const selectedBin = bins.find((b) => b._id === form.id);
  const percent = selectedBin
    ? (selectedBin.currentWeight / selectedBin.limit) * 100
    : 0;
  const exceeded = selectedBin
    ? selectedBin.currentWeight > selectedBin.limit
    : false;

  const getProgressColor = () => {
    if (percent > 100) return "bg-red-600";
    if (percent > 80) return "bg-yellow-500";
    return "bg-green-600";
  };

  const onUpdate = async () => {
    if (!form.id || isNaN(form.weight)) return;
    await dispatch(updateBinWeight({ binId: form.id, weight: form.weight }));
    // Optionally reset form to updated bin values
    const updatedBin = bins.find((b) => b._id === form.id);
    if (updatedBin) {
      setForm({ id: updatedBin._id, weight: updatedBin.currentWeight });
    }
  };

  return (
    <div className="w-full md:w-1/2 bg-white rounded-xl shadow-lg p-6 my-10">
      <h3 className="text-xl font-bold mb-6">Smart Bin Manual Update</h3>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading && <div className="text-blue-600 mb-2">Updating...</div>}

      {/* --- Selected Bin Info --- */}
      {selectedBin && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {binTypes.find((type) => type._id === selectedBin.type)?.name ||
                selectedBin.type}{" "}
              Bin
            </span>
            <span className="text-sm text-gray-500">
              Bin #{selectedBin._id.slice(0, 2)}...{selectedBin._id.slice(-4)}
            </span>
          </div>

          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`${getProgressColor()} h-4 transition-all duration-500`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-sm mt-1">
            <span>
              {selectedBin.currentWeight} unit
              {exceeded && (
                <span className="text-red-600 font-semibold ml-1">
                  (+{(selectedBin.currentWeight - selectedBin.limit).toFixed(1)}
                  )
                </span>
              )}
            </span>
            <span>{selectedBin.limit} unit limit</span>
          </div>
        </div>
      )}

      {/* --- Update Form --- */}
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">Select Bin:</label>
        <select
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.id}
          onChange={(e) => {
            const bin = bins.find((b) => b._id === e.target.value);
            setForm({
              id: e.target.value,
              weight: bin ? bin.currentWeight : 0,
            });
          }}
        >
          {bins.map((bin) => (
            <option key={bin._id} value={bin._id}>
              {binTypes.find((type) => type._id === bin.type)?.name || bin.type}{" "}
              (Bin #{bin._id.slice(0, 2)}...{bin._id.slice(-4)})
            </option>
          ))}
        </select>

        <label className="text-sm font-medium">
          Enter Current Unit (unit):
        </label>
        <input
          type="number"
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.weight}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, weight: Number(e.target.value) }))
          }
        />

        <button
          onClick={onUpdate}
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          disabled={loading}
        >
          Update Reading
        </button>
      </div>
    </div>
  );
};

export default WeightForm;

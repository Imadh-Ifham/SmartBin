import React from "react";

interface Bin {
  id: number;
  type: string;
  currentWeight: number;
  limit: number;
}

interface Props {
  bins: Bin[];
  form: { id: number; weight: number };
  setForm: (f: { id: number; weight: number }) => void;
  onUpdate: () => void;
}

const WeightForm: React.FC<Props> = ({ bins, form, setForm, onUpdate }) => {
  const selectedBin = bins.find((b) => b.id === form.id)!;
  const percent = (selectedBin.currentWeight / selectedBin.limit) * 100;
  const exceeded = selectedBin.currentWeight > selectedBin.limit;

  const getProgressColor = () => {
    if (percent > 100) return "bg-red-600";
    if (percent > 80) return "bg-yellow-500";
    return "bg-green-600";
  };

  return (
    <div className="w-full md:w-1/2 bg-white rounded-xl shadow-lg p-6 my-10">
      <h3 className="text-xl font-bold mb-6">Smart Bin Manual Update</h3>

      {/* --- Selected Bin Info --- */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">{selectedBin.type} Bin</span>
          <span className="text-sm text-gray-500">Bin #{selectedBin.id}</span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`${getProgressColor()} h-4 transition-all duration-500`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-sm mt-1">
          <span>
            {selectedBin.currentWeight} kg
            {exceeded && (
              <span className="text-red-600 font-semibold ml-1">
                (+{(selectedBin.currentWeight - selectedBin.limit).toFixed(1)})
              </span>
            )}
          </span>
          <span>{selectedBin.limit} kg limit</span>
        </div>
      </div>

      {/* --- Update Form --- */}
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">Select Bin:</label>
        <select
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: Number(e.target.value) })}
        >
          {bins.map((bin) => (
            <option key={bin.id} value={bin.id}>
              {bin.type} (Bin #{bin.id})
            </option>
          ))}
        </select>

        <label className="text-sm font-medium">
          Enter Current Weight (kg):
        </label>
        <input
          type="number"
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
        />

        <button
          onClick={onUpdate}
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Update Reading
        </button>
      </div>
    </div>
  );
};

export default WeightForm;

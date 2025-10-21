import React, { useState } from "react";
import { useAppDispatch } from "../../../app/hooks";
import {
  fetchBinTypes,
  fetchQRWithBins,
} from "../../smart-bin/slices/binThunk";

const ManualScanner: React.FC = () => {
  const [value, setValue] = useState("");

  const dispatch = useAppDispatch();

  const handleSubmit = () => {
    const fetchData = async () => {
      await dispatch(fetchQRWithBins(value));
      await dispatch(fetchBinTypes());
    };
    fetchData();
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700">
        Enter bin code
      </label>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 border rounded-md px-3 py-2"
          placeholder={"e.g. WP-81582-K"}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
          onClick={() => handleSubmit()}
        >
          Scan
        </button>
      </div>
    </div>
  );
};

export default ManualScanner;

import React, { useState } from "react";
import ScanService from "../services/ScanService";

const scanService = new ScanService();

const ManualScanner: React.FC = () => {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (!value) {
      setLocalError("Please enter a bin code or QR payload");
      return;
    }

    // Use scanService to validate/parse
    const id = scanService.parseId(value);
    if (id === null) {
      // still emit the raw so the page can decide, but show warning
      setLocalError("Could not parse an id from input. Sending raw payload.");
    } else {
      setLocalError(null);
    }

    // dispatch cross-browser safe custom event
    const dispatchSmartbinEvent = (detailValue: string) => {
      if (typeof window.CustomEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("smartbin:scan", { detail: detailValue })
        );
        return;
      }

      // older browsers (very rare) fallback
      const ev = document.createEvent("Event");
      ev.initEvent("smartbin:scan", true, true);
      (ev as any).detail = detailValue;
      window.dispatchEvent(ev as any);
    };

    dispatchSmartbinEvent(value);
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
          placeholder={"e.g. 4265 7890"}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
          onClick={submit}
        >
          Scan
        </button>
      </div>
      {localError && (
        <div className="text-sm text-red-600 mt-2">{localError}</div>
      )}
    </div>
  );
};

export default ManualScanner;

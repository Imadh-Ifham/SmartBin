import React from "react";
import FileService from "../services/FileService";

const fileService = new FileService();

interface Props {
  lastScan?: string | null;
  onUpload: (data: string) => void;
  onMarkCollected: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

const ScanControls: React.FC<Props> = ({
  lastScan,
  onUpload,
  onMarkCollected,
  onSkip,
  disabled,
}) => {
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await fileService.readFileAsText(f);
      onUpload(data);
    } catch (err) {
      console.error("Failed to read file", err);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      <input
        type="file"
        accept="*/*"
        onChange={onFilePicked}
        className="hidden"
        id="scan-file-ctrl"
      />
      <label
        htmlFor="scan-file-ctrl"
        className="bg-gray-100 px-3 py-2 rounded-md cursor-pointer"
      >
        Upload (fallback)
      </label>
      <button
        className="bg-green-600 text-white px-3 py-2 rounded-md"
        onClick={onMarkCollected}
        disabled={disabled}
      >
        Mark Collected
      </button>
      <button
        className="bg-red-600 text-white px-3 py-2 rounded-md"
        onClick={onSkip}
        disabled={disabled}
      >
        Skip
      </button>
      {lastScan && (
        <div className="ml-auto text-sm text-gray-700">Last: {lastScan}</div>
      )}
    </div>
  );
};

export default ScanControls;

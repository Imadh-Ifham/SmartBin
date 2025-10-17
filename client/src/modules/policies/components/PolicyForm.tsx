import React, { useState } from "react";
import type { Policy, PolicyStatus } from "../types";

export interface PolicyFormProps {
  initialData?: Partial<Policy>;
  onSubmit: (data: Partial<Policy>) => void | Promise<void>;
  loading?: boolean;
}

const statusOptions: PolicyStatus[] = ["Draft", "Active", "Retired"];

const PolicyForm: React.FC<PolicyFormProps> = ({ initialData, onSubmit, loading }) => {
  const [formData, setFormData] = useState<Partial<Policy>>(
    initialData || {
      title: "",
      description: "",
      category: "",
      ministry: "",
      effectiveDate: "",
      status: "Draft"
    }
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto space-y-4"
    >
      <h2 className="text-xl font-semibold text-blue-700">
        {initialData ? "Edit Policy" : "Add New Policy"}
      </h2>

      <label className="block">
        <span className="sr-only">Policy title</span>
        <input
          id="policy-title"
          name="title"
          value={formData.title ?? ""}
          onChange={handleChange}
          placeholder="Policy Title"
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block">
        <span className="sr-only">Policy description</span>
        <textarea
          id="policy-description"
          name="description"
          value={formData.description ?? ""}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={4}
          required
        />
      </label>

      <label className="block">
        <span className="sr-only">Category</span>
        <input
          id="policy-category"
          name="category"
          value={formData.category ?? ""}
          onChange={handleChange}
          placeholder="Category"
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        <span className="sr-only">Ministry</span>
        <input
          id="policy-ministry"
          name="ministry"
          value={formData.ministry ?? ""}
          onChange={handleChange}
          placeholder="Ministry"
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        <span className="sr-only">Effective date</span>
        <input
          id="policy-effectiveDate"
          type="date"
          name="effectiveDate"
          value={formData.effectiveDate ?? ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block">
        <span className="sr-only">Status</span>
        <select
          id="policy-status"
          name="status"
          value={formData.status ?? "Draft"}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
      >
        {loading ? "Saving..." : initialData ? "Update Policy" : "Create Policy"}
      </button>
    </form>
  );
};

export default PolicyForm;

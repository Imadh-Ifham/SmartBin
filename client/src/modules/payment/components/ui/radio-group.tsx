import * as React from "react";

interface RadioGroupContextValue {
  value: string;
  setValue: (v: string) => void;
}

const Ctx = React.createContext<RadioGroupContextValue | null>(null);

export function RadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={{ value, setValue: onValueChange }}>
      {children}
    </Ctx.Provider>
  );
}

export function RadioGroupItem({ value, id }: { value: string; id: string }) {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const checked = ctx.value === value;
  return (
    <input
      type="radio"
      id={id}
      name="radio-group"
      value={value}
      checked={checked}
      onChange={() => ctx.setValue(value)}
      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
    />
  );
}

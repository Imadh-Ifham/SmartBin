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
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Ctx.Provider value={{ value, setValue: onValueChange }}>
        {children}
      </Ctx.Provider>
    </div>
  );
}

export function RadioGroupItem({
  value,
  id,
  disabled,
  className,
}: {
  value: string;
  id: string;
  disabled?: boolean;
  className?: string;
}) {
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
      disabled={disabled}
      className={
        "w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400 " +
        (className ?? "")
      }
    />
  );
}

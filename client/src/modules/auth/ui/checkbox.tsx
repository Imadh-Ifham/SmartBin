import * as React from "react";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "checked"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ onCheckedChange, checked, ...props }: Props) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
      className={
        "w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 " +
        (props.className ?? "")
      }
    />
  );
}

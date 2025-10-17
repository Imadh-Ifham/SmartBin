import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const sizeMap: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-base rounded-md",
  lg: "px-5 py-3 text-base rounded-lg",
};

const variantMap: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed",
  outline:
    "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-gray-900 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center ${sizeMap[size]} ${variantMap[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;

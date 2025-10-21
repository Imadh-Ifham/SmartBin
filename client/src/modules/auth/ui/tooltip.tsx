import * as React from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="relative group inline-block">{children}</div>;
}

export function TooltipTrigger({
  asChild: _asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2 py-1 hidden group-hover:block shadow">
      {children}
    </div>
  );
}

import * as React from "react";

type TabsValue = string;

interface TabsContextValue {
  value: TabsValue;
  setValue: (v: TabsValue) => void;
}

const TabsCtx = React.createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, children, className = "" }: { value: TabsValue; onValueChange: (v: TabsValue) => void; children: React.ReactNode; className?: string; }) {
  return (
    <TabsCtx.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex gap-2 bg-gray-100 p-1 rounded-md">{children}</div>;
}

export function TabsTrigger({ value, children }: { value: TabsValue; children: React.ReactNode }) {
  const ctx = React.useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-1.5 rounded-md text-sm ${active ? "bg-white shadow border" : "text-gray-600 hover:text-gray-900"}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }: { value: TabsValue; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}

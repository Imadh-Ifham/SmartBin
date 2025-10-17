import * as React from "react";

export function Table({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full text-left ${className}`} {...props} />;
}
export function TableHeader(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return <thead {...props} />;
}
export function TableBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return <tbody {...props} />;
}
export function TableRow({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b last:border-0 ${className}`} {...props} />;
}
export function TableHead({
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-2 text-sm font-medium text-gray-600 ${className}`}
      {...props}
    />
  );
}
export function TableCell({
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 align-middle ${className}`} {...props} />;
}

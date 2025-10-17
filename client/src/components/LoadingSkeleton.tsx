/**
 * Loading Skeleton - Professional loading states for better UX
 * Shows placeholder content while data is loading
 */

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            {[...Array(5)].map((_, i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, rowI) => (
            <tr key={rowI} className="border-b border-slate-200">
              {[...Array(5)].map((_, colI) => (
                <td key={colI} className="px-6 py-4">
                  <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3"></div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-${columns} gap-6`}>
      {[...Array(columns * 2)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 space-y-2">
          <div className="h-5 bg-slate-200 rounded animate-pulse w-2/3"></div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-4/5"></div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-10 bg-slate-200 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded animate-pulse w-24"></div>
        ))}
      </div>

      {/* Content */}
      <TableSkeleton />
    </div>
  );
}

export default {
  TableSkeleton,
  CardSkeleton,
  GridSkeleton,
  ListSkeleton,
  PageSkeleton,
};

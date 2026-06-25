import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 20;

export default function PaginatedList({
  children,
  className = "admin-list",
  emptyText = "No items found.",
  gridClassName = "admin-list-grid",
  items = [],
  label = "items",
  pageSize = DEFAULT_PAGE_SIZE
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);
  const startItem = items.length ? (safePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safePage * pageSize, items.length);

  return (
    <div className={className}>
      {items.length ? (
        <>
          <div className={gridClassName}>{visibleItems.map(children)}</div>
          <div className="pagination-row">
            <p className="form-note">
              Showing {startItem}-{endItem} of {items.length} {label}
            </p>
            <div className="button-row">
              <button
                className="button secondary compact"
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span>
                Page {safePage} of {totalPages}
              </span>
              <button
                className="button secondary compact"
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="empty-state">{emptyText}</p>
      )}
    </div>
  );
}

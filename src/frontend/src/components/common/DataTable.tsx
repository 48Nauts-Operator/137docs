import React from 'react';

/* ----------------------------------------------------------------------------
 * Re-usable table component
 * ----------------------------------------------------------------------------
 * Usage example:
 *
 *   <DataTable
 *     columns={[
 *       { header: 'Name', accessor: 'name' },
 *       { header: 'Email', accessor: row => <a href={`mailto:${row.email}`}>{row.email}</a> },
 *       { header: 'Actions', accessor: (_, i) => <button onClick={() => alert(i)}>Open</button>, align: 'right' },
 *     ]}
 *     data={rows}
 *     isStriped
 *     onRowClick={row => console.log(row)}
 *   />
 * ----------------------------------------------------------------------------
 */

type Accessor<T> = keyof T | ((row: T, rowIndex: number) => React.ReactNode);

export interface Column<T = any> {
  header: React.ReactNode;
  accessor: Accessor<T>;
  /** Unique id for column – required for column picker */
  id?: string;
  /** Optional custom class for <td> */
  className?: string;
  /** Text alignment – defaults to left */
  align?: 'left' | 'center' | 'right';
  /** Optional width */
  width?: string;
}

export interface DataTableProps<T = any> {
  /** Column definitions */
  columns: Column<T>[];
  /** Row data */
  data: T[];
  /** Zebra-stripe rows */
  isStriped?: boolean;
  /** Highlight row on hover (default true) */
  hoverHighlight?: boolean;
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Provide stable key; defaults to row.id or index */
  rowKey?: (row: T, index: number) => string | number;
  /** Additional classes for <table> element */
  className?: string;
  /** Optional callback to append extra classnames per row */
  getRowClass?: (row: T, index: number) => string;
  /** Enable built-in pagination */
  enablePagination?: boolean;
  /** Page-size options, default [10,25,50] */
  pageSizeOptions?: number[];
  /** Initial page size (default 10) */
  initialPageSize?: number;
  /** Enable column picker */
  enableColumnPicker?: boolean;
  /** Default hidden columns */
  defaultHiddenCols?: string[];
}

function resolveCell<T>(row: T, accessor: Accessor<T>, index: number) {
  if (typeof accessor === 'function') return accessor(row, index);
  return (row as any)[accessor];
}

function DataTable<T = any>({
  columns,
  data,
  isStriped = false,
  hoverHighlight = true,
  onRowClick,
  rowKey,
  className = '',
  getRowClass,
  enablePagination = false,
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  enableColumnPicker = false,
  defaultHiddenCols = [],
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = React.useState<number>(initialPageSize);
  const [page, setPage] = React.useState<number>(0); // zero-based index

  // Reset page when data length changes or pageSize shrinks
  React.useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(data.length / pageSize) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [data.length, pageSize]);

  // Column visibility -----------------------------------------------------
  const [hiddenCols, setHiddenCols] = React.useState<string[]>(defaultHiddenCols);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const visibleColumns = enableColumnPicker
    ? columns.filter((c) => !c.id || !hiddenCols.includes(c.id))
    : columns;

  const paginatedData = enablePagination
    ? data.slice(page * pageSize, page * pageSize + pageSize)
    : data;

  return (
    <div className="overflow-x-auto">
      {/* Column picker (top-right) */}
      {enableColumnPicker && (
        <div className="flex justify-end mb-2">
          <div className="relative">
            <button
              className="flex items-center gap-1 text-sm px-2 py-1 border rounded dark:border-secondary-600 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              onClick={() => setPickerOpen((o) => !o)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h7.172a1 1 0 00.707-.293l2.414-2.414A1 1 0 0118.414 3H20a1 1 0 011 1v2a1 1 0 01-1 1h-1.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8.121a1 1 0 01-.707-.293L5 7.586A1 1 0 004.293 7H3a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h7.172a1 1 0 00.707-.293l2.414-2.414A1 1 0 0118.414 12H20a1 1 0 011 1v2a1 1 0 01-1 1h-1.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8.121a1 1 0 01-.707-.293L5 16.586A1 1 0 004.293 16H3a1 1 0 01-1-1v-2z" /></svg>
              Columns
            </button>

            {pickerOpen && (
              <div className="absolute right-0 mt-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded shadow-md z-50 p-2 text-sm min-w-max">
                {columns.filter((c)=>c.id).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 py-0.5 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={!hiddenCols.includes(c.id!)}
                      onChange={() =>
                        setHiddenCols((prev) =>
                          prev.includes(c.id!) ? prev.filter((x) => x !== c.id) : [...prev, c.id!]
                        )
                      }
                    />
                    {typeof c.header === 'string' ? c.header : 'Column'}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <table
        className={`min-w-full text-sm border-collapse ${className}`.trim()}
      >
        {/* Header */}
        <thead className="bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200">
          <tr>
            {visibleColumns.map((col, idx) => (
              <th
                key={idx}
                style={{ width: col.width }}
                className={`px-4 py-2 font-semibold text-left ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {paginatedData.map((row, i) => {
            const key = rowKey ? rowKey(row, i) : (row as any).id ?? i;
            const rowClasses = [
              isStriped && i % 2 === 1 ? 'bg-secondary-50 dark:bg-secondary-900/40' : '',
              hoverHighlight ? 'hover:bg-secondary-50 dark:hover:bg-secondary-800 cursor-pointer' : '',
              getRowClass ? getRowClass(row, i) : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <tr
                key={key}
                className={rowClasses}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {visibleColumns.map((col, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-2 border-b border-secondary-200 dark:border-secondary-700 whitespace-nowrap ${col.className ?? ''} ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : ''
                    }`}
                  >
                    {resolveCell(row, col.accessor, i) ?? '—'}
                  </td>
                ))}
              </tr>
            );
          })}

          {paginatedData.length === 0 && (
            <tr>
              <td
                colSpan={visibleColumns.length}
                className="px-4 py-6 text-center text-secondary-500 dark:text-secondary-400"
              >
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {enablePagination && data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 text-sm text-secondary-600 dark:text-secondary-400">
          <div>
            Show&nbsp;
            <select
              className="border rounded px-1 py-0.5 bg-transparent dark:border-secondary-600"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="dark:bg-secondary-800">
                  {opt}
                </option>
              ))}
            </select>
            &nbsp;rows
          </div>

          <div className="space-x-2 flex items-center">
            <button
              className="px-2 py-0.5 border rounded disabled:opacity-30"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <span>
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.length)} of {data.length}
            </span>
            <button
              className="px-2 py-0.5 border rounded disabled:opacity-30"
              disabled={(page + 1) * pageSize >= data.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable; 
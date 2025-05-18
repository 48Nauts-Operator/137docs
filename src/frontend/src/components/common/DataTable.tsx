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
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full text-sm border-collapse ${className}`.trim()}
      >
        {/* Header */}
        <thead className="bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200">
          <tr>
            {columns.map((col, idx) => (
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
          {data.map((row, i) => {
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
                {columns.map((col, ci) => (
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

          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-secondary-500 dark:text-secondary-400"
              >
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable; 
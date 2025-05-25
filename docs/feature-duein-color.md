# Invoice "Due In" Colour Coding

Added in **v0.10 (2025-05-24)**, the invoices table now highlights approaching or overdue payment deadlines directly in the **Due In** column.

| Days until due | Colour  | Example |
|----------------|---------|---------|
| > 30           | Blue    | `45d`   |
| 14 – 30        | Yellow  | `21d`   |
| < 14 or past   | Red     | `-3d` / `0d` |
| Paid           | Neutral (grey/white) and shows `0` |

Rules implemented in `src/frontend/src/components/invoices/InvoiceTable.tsx`.

Benefits:
* Scan the list and instantly spot urgent invoices.
* Avoid mistaking paid items for overdue; paid rows always show **0** with neutral colour.

No backend changes—pure UI logic. 
---
name: excel-template-dynamic-mapping
description: Write data to multi-sheet Excel templates with dynamic column mapping from header rows. Handles fixed N-row headers, stale data clearing, and different column layouts per sheet.

  Keywords: excel, openpyxl, template, column mapping, multi-sheet, header rows, product feed, zalando, amazon, inventory export, etl, xlsx, spreadsheet
license: MIT
---

# Excel Template Dynamic Column Mapping

**Status**: Production Ready
**Extracted:** 2026-02-13
**Context:** Writing data to multi-sheet Excel templates with fixed header rows and dynamic column layouts (e.g., Zalando product feeds, inventory exports, ERP integrations)

---

## Problem

Excel templates with multi-row headers (row 1: human labels, row 2: API field codes, row 3: data types) require writing data to the correct columns without hardcoding column indices. Each sheet may have different column orders and field sets. Stale data in sheets that don't receive new data must also be cleared.

---

## Solution

Use openpyxl to:
1. **Clear ALL sheets first** (not just the ones you write to — prevents stale data)
2. **Read field codes from a header row** to build a dynamic `col_map: dict[str, int]`
3. **Write data using field codes** as keys, not column indices
4. **Preserve N header rows** (delete only from row N+1 onwards)

```python
import openpyxl

def write_template_excel(template_path, output_path, categorized_data, header_rows=3):
    """Write data to a multi-sheet Excel template with dynamic column mapping."""
    wb = openpyxl.load_workbook(template_path)

    # Step 1: Clear ALL sheets (prevents stale data in unused sheets)
    data_start = header_rows + 1
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        if ws.max_row >= data_start:
            ws.delete_rows(data_start, ws.max_row - header_rows)

    # Step 2: Write data per sheet
    for sheet_name, rows_data in categorized_data.items():
        if sheet_name not in wb.sheetnames:
            continue

        ws = wb[sheet_name]

        # Build column map from field code row (e.g., row 2)
        field_code_row = 2  # row containing API field codes
        col_map = {}
        for cell in ws[field_code_row]:
            if cell.value:
                col_map[cell.value] = cell.column

        # Write rows starting after headers
        for offset, row_data in enumerate(rows_data):
            row_num = data_start + offset
            for field_code, value in row_data.items():
                if field_code in col_map:
                    ws.cell(row=row_num, column=col_map[field_code], value=value)

    wb.save(output_path)
    wb.close()
```

---

## Key Insights

- **Always clear ALL sheets first**, not just the ones you write to. Otherwise sheets that had data in the template but receive no new data will retain stale rows.
- **Never hardcode column indices.** Templates get columns reordered, added, or removed. Dynamic mapping from field codes is resilient.
- **Sheet names may contain unusual whitespace.** Zalando uses triple-space separators (e.g., `"T-Shirt   Top"`). Always use exact sheet names from `wb.sheetnames`.
- **`delete_rows(start, count)`** deletes `count` rows starting at `start`. To clear from row 4 onward: `delete_rows(4, max_row - 3)`.

---

## When to Use

- Writing to Excel templates with fixed headers (Zalando, Amazon, eBay product feeds)
- Multi-sheet workbooks where each sheet has different columns
- Any ETL pipeline that outputs to a predefined Excel format
- Inventory/catalog export systems using openpyxl

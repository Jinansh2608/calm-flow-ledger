// ============================================================
// EDITABLE GRID COMPONENT
// Generic editable grid for BOQs and Procurement
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverAnchor } from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import {
  ColumnConfig,
  QUOTATION_COLUMNS,
  createEmptyRow,
  calculateRowTotals,
  getGrandTotals,
  SAMPLE_ITEMS,
  SystemItem,
} from "@/config/DynamicColumnConfig";

interface EditableGridProps {
  columns?: ColumnConfig[];
  rows: Record<string, any>[];
  onRowsChange: (rows: Record<string, any>[]) => void;
  readOnly?: boolean;
  showExport?: boolean;
  onExport?: () => void;
  title?: string;
  compact?: boolean;
  validationErrors?: string[];
  minHeight?: string;
  className?: string;
  allowAddRows?: boolean;
  showSummary?: boolean;
  recommendations?: SystemItem[] | Record<string, SystemItem[]>;
}

const EditableGrid = ({
  columns = QUOTATION_COLUMNS,
  rows,
  onRowsChange,
  readOnly = false,
  showExport = false,
  onExport,
  title,
  compact = false,
  validationErrors = [],
  minHeight,
  className,
  allowAddRows = true,
  showSummary = true,
  recommendations = [],
}: EditableGridProps) => {
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [originalValue, setOriginalValue] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<SystemItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionRowIdx, setSuggestionRowIdx] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // ============================================================
  // CELL VALUE CHANGE
  // ============================================================
  const handleCellChange = useCallback(
    (rowIdx: number, colKey: string, value: any) => {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [colKey]: value };
      onRowsChange(updated);
    },
    [rows, onRowsChange]
  );

  // ============================================================
  // KEYBOARD NAVIGATION
  // ============================================================
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIdx: number, colIdx: number, value: any) => {
      const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

      if (e.key === "Escape" && isEditing) {
        setEditingCell(null);
        // rollback
        const updated = [...rows];
        updated[rowIdx] = { ...updated[rowIdx], [columns[colIdx].key]: originalValue };
        onRowsChange(updated);
        gridRef.current?.focus();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (isEditing) {
          // Commit
          toast({ title: "Saved", description: "Cell updated successfully." });
          setEditingCell(null);
          if (rowIdx < rows.length - 1) {
             setActiveCell({ row: rowIdx + 1, col: colIdx });
          }
        } else {
          // Enter Edit Mode
          setOriginalValue(value);
          setEditingCell({ row: rowIdx, col: colIdx });
          setTimeout(() => inputRefs.current.get(`${rowIdx}-${colIdx}`)?.focus(), 50);
        }
        return;
      }

      if (isEditing) return; // Allow normal text navigation when editing

      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
        if (nextCol >= 0 && nextCol < columns.length) {
          setActiveCell({ row: rowIdx, col: nextCol });
        } else if (!e.shiftKey && nextCol >= columns.length && rowIdx < rows.length - 1) {
          setActiveCell({ row: rowIdx + 1, col: 0 });
        }
      }

      if (e.key === "ArrowDown" && rowIdx < rows.length - 1) {
        setActiveCell({ row: rowIdx + 1, col: colIdx });
      }

      if (e.key === "ArrowUp" && rowIdx > 0) {
        setActiveCell({ row: rowIdx - 1, col: colIdx });
      }

      if (e.key === "ArrowRight" && colIdx < columns.length - 1) {
        setActiveCell({ row: rowIdx, col: colIdx + 1 });
      }

      if (e.key === "ArrowLeft" && colIdx > 0) {
        setActiveCell({ row: rowIdx, col: colIdx - 1 });
      }
    },
    [columns, rows, editingCell, handleCellChange, originalValue, onRowsChange]
  );

  // ============================================================
  // PASTE HANDLER
  // ============================================================
  const handleGridPaste = useCallback((e: React.ClipboardEvent) => {
     if (editingCell || !activeCell) return;
     const clipboardData = e.clipboardData.getData('Text');
     if (!clipboardData) return;

     const pasteRows = clipboardData.split('\n').filter(r => r.trim());
     if (pasteRows.length > 0) {
         e.preventDefault();
         const updated = [...rows];
         let currRow = activeCell.row;
         let hasError = false;

         for (const rowText of pasteRows) {
            const cells = rowText.split('\t');
            if (currRow >= updated.length) {
              updated.push(createEmptyRow(updated.length));
            }
            let currCol = activeCell.col;
            for (const cellVal of cells) {
               if (currCol < columns.length) {
                 const colConfig = columns[currCol];
                 if (colConfig.editable !== false && !['total', 'total_price'].includes(colConfig.key)) {
                    let val: any = cellVal.trim();
                    if (colConfig.inputType === 'number' || colConfig.inputType === 'percentage') {
                       const num = Number(val);
                       if (isNaN(num)) { hasError = true; } else { val = num; }
                    }
                    updated[currRow] = { ...updated[currRow], [colConfig.key]: val };
                 }
               }
               currCol++;
            }
            currRow++;
         }

         if (hasError) {
             toast({ title: "Paste Warning", description: "Some values had invalid formats.", variant: "destructive" });
         } else {
             toast({ title: "Spreadsheet Data Pasted", description: `Successfully pasted ${pasteRows.length} row(s).` });
         }
         onRowsChange(updated);
     }
  }, [activeCell, editingCell, rows, columns, onRowsChange]);

  // ============================================================
  // AUTOFILL LOGIC
  // ============================================================
  const handleSearchInput = useCallback(
    (rowIdx: number, colKey: string, value: string) => {
      handleCellChange(rowIdx, colKey, value);

      if (value.length >= 2) {
        let source: SystemItem[] = [];
        if (Array.isArray(recommendations)) {
          source = recommendations;
        } else if (recommendations && typeof recommendations === 'object' && (recommendations as Record<string, SystemItem[]>)[colKey]) {
          source = (recommendations as Record<string, SystemItem[]>)[colKey];
        }

        // Fallback for item names if no custom recommendations provided
        if (source.length === 0 && (colKey === 'item_name' || colKey === 'name')) {
          source = SAMPLE_ITEMS;
        }

        const matches = source.filter((item) =>
          item.name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
        setSuggestionRowIdx(rowIdx);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    },
    [handleCellChange, recommendations]
  );

  const handleSelectSuggestion = useCallback(
    (rowIdx: number, item: SystemItem, colKey: string) => {
      const updated = [...rows];
      const row = { ...updated[rowIdx] };

      // Primary mapping: Use the column key that triggered the search
      row[colKey] = item.name;

      // Special handling for project items to maintain sync
      if (item.id.startsWith('project-item-')) {
        const originalId = parseInt(item.id.replace('project-item-', ''));
        if (!isNaN(originalId)) {
          row.client_line_item_id = originalId;
        }
      }

      // Special handling for vendors
      if (item.id.startsWith('vendor-')) {
        const vendorId = parseInt(item.id.replace('vendor-', ''));
        if (!isNaN(vendorId)) {
          row.vendor_id = vendorId;
        }
      }

      // Secondary mapping (Autofill): Only if we are picking a primary item
      if (colKey === 'item_name' || colKey === 'name') {
        row.hsn_sac_code = item.hsn_sac_code || row.hsn_sac_code || '';
        row.type_of_boq = item.type_of_boq || row.type_of_boq || '';
        row.units = item.units || row.units || '';
        
        if ('price' in row) row.price = item.price ?? row.price ?? 0;
        if ('unit_price' in row) row.unit_price = item.price ?? row.unit_price ?? 0;
        
        row.tax = item.tax ?? row.tax ?? 18;
      }

      updated[rowIdx] = row;
      onRowsChange(updated);
      setShowSuggestions(false);
      setSuggestions([]);
      setEditingCell(null); // Exit edit mode after selection
    },
    [rows, onRowsChange]
  );

  // ============================================================
  // ROW MANAGEMENT
  // ============================================================
  const addRow = useCallback(() => {
    // Determine which template to use based on columns
    const isProcurement = columns.some(c => c.key === 'item_name');
    const newRow = isProcurement 
        ? { _id: crypto.randomUUID(), item_name: "", quantity: 1, unit_price: 0, status: 'pending', delivery_progress: 0 }
        : createEmptyRow(rows.length);
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange, columns]);

  const deleteRow = useCallback(
    (rowIdx: number) => {
      const updated = rows.filter((_, i) => i !== rowIdx);
      onRowsChange(updated);
    },
    [rows, onRowsChange]
  );

  // ============================================================
  // TOTALS
  // ============================================================
  const totals = getGrandTotals(rows);

  const formatCurrencyValue = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);

  const formatValue = (value: any, format?: string) => {
    if (value === "" || value === undefined || value === null) return "";
    if (format === "currency") return formatCurrencyValue(Number(value));
    if (format === "percentage") return `${value}%`;
    return value;
  };

  // ============================================================
  // RENDER CELL
  // ============================================================
  const renderCell = (
    col: ColumnConfig,
    row: Record<string, any>,
    rowIdx: number,
    colIdx: number
  ) => {
    const cellKey = `${rowIdx}-${colIdx}`;
    const value = row[col.key];

    // Read-only mode or Auto-calculated 'total' / 'total_price'
    if (readOnly || col.key === "total" || col.key === "total_price") {
      let displayValue = value;
      
      if (col.key === "total") {
        const { rowGrand } = calculateRowTotals(row);
        displayValue = rowGrand;
      } else if (col.key === "total_price") {
        const qty = Number(row.quantity) || 0;
        const price = Number(row.unit_price) || 0;
        displayValue = qty * price;
      }

      return (
        <div
          className={cn(
            "px-4 py-3 text-sm tabular-nums font-medium transition-all duration-300",
            col.alignment === "right" && "text-right",
            col.alignment === "center" && "text-center",
            (col.key === "total" || col.key === "total_price") && "text-primary font-bold bg-primary/5"
          )}
        >
          {formatValue(displayValue, col.format)}
        </div>
      );
    }

    const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

    if (!isEditing && col.editable !== false && !['total', 'total_price'].includes(col.key)) {
        const isActive = activeCell?.row === rowIdx && activeCell?.col === colIdx;
        return (
          <div 
            className={cn(
              "px-4 py-3 text-sm tabular-nums min-h-[40px] flex items-center select-none cursor-default truncate overflow-hidden max-w-full relative",
              col.alignment === "right" && "justify-end",
              col.alignment === "center" && "justify-center"
            )}
            onClick={(e) => {
                e.preventDefault();
                setActiveCell({ row: rowIdx, col: colIdx });
            }}
            onDoubleClick={() => {
               setOriginalValue(value);
               setEditingCell({ row: rowIdx, col: colIdx });
               setTimeout(() => inputRefs.current.get(cellKey)?.focus(), 50);
            }}
          >
            {formatValue(value, col.format)}
            {isActive && <div className="sr-only">Press Enter to edit</div>}
          </div>
        );
    }

    // Dropdown
    if (col.inputType === "dropdown") {
      return (
        <Select
          value={String(value || "")}
          onValueChange={(val) => {
            handleCellChange(rowIdx, col.key, val);
            setEditingCell(null);
          }}
          defaultOpen={isEditing}
          onOpenChange={(open) => {
             if (!open) {
                 setEditingCell(null);
                 gridRef.current?.focus();
             }
          }}
        >
          <SelectTrigger
            className={cn(
              "h-9 border-0 bg-transparent text-sm rounded-none focus:ring-1 focus:ring-primary/40 focus:bg-primary/5",
              col.alignment === "right" && "text-right",
              compact && "h-7 text-xs"
            )}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {col.dropdownOptions?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Searchable
    if (col.inputType === "searchable") {
      const open = showSuggestions && suggestionRowIdx === rowIdx && suggestions.length > 0;
      return (
        <Popover open={open}>
          <PopoverAnchor asChild>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <Input
                  ref={(el) => {
                    if (el) inputRefs.current.set(cellKey, el);
                  }}
                  value={value || ""}
                  onChange={(e) =>
                    handleSearchInput(rowIdx, col.key, e.target.value)
                  }
                  onFocus={() => {
                    if (!isEditing) {
                       setOriginalValue(value);
                       setEditingCell({ row: rowIdx, col: colIdx });
                    }
                  }}
                  onBlur={() => {
                     setTimeout(() => {
                        if (document.activeElement?.className?.includes('suggest')) return;
                        setEditingCell(null);
                        setShowSuggestions(false);
                     }, 200);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx, value)}
                  autoFocus={isEditing}
                  className={cn(
                    "h-11 border-0 bg-transparent text-sm rounded-none pl-8 focus:ring-1 focus:ring-primary/40 focus:bg-primary/5 font-semibold tracking-tight transition-all duration-300",
                    compact && "h-8 text-xs pl-7"
                  )}
                  placeholder="Search or specify item..."
                />
              </div>
            </div>
          </PopoverAnchor>
          <PopoverContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0 border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl bg-popover/90 z-[100]"
            align="start"
            sideOffset={8}
          >
            <div className="px-4 py-3 border-b border-border/10 bg-indigo-50/20 dark:bg-indigo-500/5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em]">Registry Discovery</p>
              </div>
            </div>
            <div className="overflow-y-auto max-h-54 py-1">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex items-center justify-between group/suggest suggest outline-none focus-visible:bg-indigo-500/20 border-b border-border/5 last:border-0"
                  onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur from winning
                      handleSelectSuggestion(rowIdx, item, col.key);
                  }}
                  type="button"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 dark:text-slate-100 group-hover/suggest:text-indigo-600 transition-colors max-w-[220px] truncate italic">{item.name}</span>
                        {item.type_of_boq === 'Movable' && (
                            <Badge variant="outline" className="h-4 text-[8px] font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-600 border-none px-1.5">Asset</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HSN: {item.hsn_sac_code || '---'}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.units}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">{formatCurrencyValue(item.price || 0)}</span>
                    <Badge variant="outline" className="h-4 text-[8px] font-bold text-slate-400 border-slate-200 uppercase tracking-widest">{item.tax}% GST</Badge>
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // Default: number / text / percentage
    return (
      <Input
        ref={(el) => {
          if (el) inputRefs.current.set(cellKey, el);
        }}
        type={col.inputType === "number" || col.inputType === "percentage" ? "number" : "text"}
        value={value ?? ""}
        onChange={(e) =>
          handleCellChange(
            rowIdx,
            col.key,
            col.inputType === "number" || col.inputType === "percentage"
              ? e.target.value === "" ? "" : Number(e.target.value)
              : e.target.value
          )
        }
        onFocus={() => {
           if (!isEditing) {
              setOriginalValue(value);
              setEditingCell({ row: rowIdx, col: colIdx });
           }
        }}
        onBlur={() => {
           setEditingCell(null);
        }}
        onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx, value)}
        autoFocus={isEditing}
        className={cn(
          "h-9 border-0 bg-transparent text-sm rounded-none tabular-nums focus:ring-1 focus:ring-primary/40 focus:bg-primary/5",
          col.alignment === "right" && "text-right",
          compact && "h-7 text-xs"
        )}
        min={col.inputType === "number" ? 0 : undefined}
        step={col.inputType === "percentage" ? 0.5 : col.format === "currency" ? 0.01 : 1}
      />
    );
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div 
      ref={gridRef}
      tabIndex={0}
      onKeyDown={(e) => {
         if (activeCell && !editingCell) {
             const key = e.key;
             if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)) {
                 const value = rows[activeCell.row][columns[activeCell.col].key];
                 handleKeyDown(e, activeCell.row, activeCell.col, value);
             } else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                 const value = rows[activeCell.row][columns[activeCell.col].key];
                 setOriginalValue(value);
                 setEditingCell(activeCell);
                 setTimeout(() => inputRefs.current.get(`${activeCell.row}-${activeCell.col}`)?.focus(), 50);
             }
         }
      }}
      onPaste={handleGridPaste}
      className={cn("space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/20", className)}
    >
      {/* Toolbar */}
      {(title || showExport || !readOnly) && (
        <div className="flex items-center justify-between pb-2">
          {title && (
            <div className="flex flex-col">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                {title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/10 font-mono h-5 px-2">
                  {rows.length} SPECIFICATIONS
                </Badge>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            {showExport && rows.length > 0 && onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-9 text-[11px] font-bold uppercase tracking-wider gap-2 px-4 rounded-xl border-dashed border-primary/30 hover:bg-primary/5 transition-all"
              >
                <Download className="h-4 w-4" />
                Export Ledger
              </Button>
            )}
            {!readOnly && allowAddRows && (
              <Button
                variant="default"
                size="sm"
                onClick={addRow}
                className="h-9 text-[11px] font-black uppercase tracking-[0.15em] gap-2 px-6 rounded-xl bg-slate-900 border-b-2 border-slate-950 hover:bg-slate-800 transition-all shadow-lg active:translate-y-0.5 active:border-b-0"
              >
                <Plus className="h-4 w-4" />
                Insert New Item
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 space-y-1">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-destructive font-medium flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-destructive shrink-0" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="relative group/grid">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent rounded-[22px] blur opacity-0 group-hover/grid:opacity-100 transition duration-1000 group-hover/grid:duration-200" />
        <div 
          className="relative border rounded-[20px] overflow-hidden bg-card/80 backdrop-blur-xl shadow-2xl border-white/10"
          style={{ minHeight: minHeight }}
        >
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <table className="w-full border-collapse border-spacing-0">
              {/* HEADER */}
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap border-r border-border/20 last:border-r-0",
                        col.alignment === "right" && "text-right",
                        col.alignment === "center" && "text-center",
                        "bg-foreground/[0.02]"
                      )}
                      style={{ minWidth: col.width }}
                    >
                      <div className="flex items-center gap-2 px-1">
                        {col.label}
                        {col.required && (
                          <span className="h-1 w-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                        )}
                      </div>
                    </th>
                  ))}
                  {!readOnly && (
                    <th className="px-2 py-4 w-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-foreground/[0.02]">
                      
                    </th>
                  )}
                </tr>
              </thead>

              {/* BODY */}
              <tbody className="divide-y divide-border/20">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (readOnly ? 0 : 1)}
                      className="text-center py-20 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center ring-1 ring-border shadow-inner">
                          <Plus className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-foreground">Specification List is Empty</p>
                          <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                            {readOnly ? "No specification data available for this quotation." : "Initialize your specification grid by adding the first item below."}
                          </p>
                        </div>
                        {!readOnly && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addRow} 
                            className="mt-2 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            Add First Item
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIdx) => (
                    <tr
                      key={row._id || rowIdx}
                      className={cn(
                        "group/row transition-all duration-200 hover:bg-muted/30",
                        activeCell?.row === rowIdx ? "bg-primary/[0.03] shadow-inner" : "even:bg-muted/10"
                      )}
                    >
                      {columns.map((col, colIdx) => (
                        <td
                          key={`${rowIdx}-${col.key}`}
                          className={cn(
                            "border-r border-border/20 last:border-r-0 relative transition-all duration-300",
                            activeCell?.row === rowIdx &&
                              activeCell?.col === colIdx &&
                              "after:absolute after:inset-0 after:border-2 after:border-primary/30 after:pointer-events-none bg-primary/[0.03]"
                          )}
                          style={{ minWidth: col.width }}
                          onClick={() => {
                            if (col.editable !== false) {
                              setActiveCell({ row: rowIdx, col: colIdx });
                            }
                          }}
                        >
                          <div className={cn(
                            "transition-transform duration-200",
                            activeCell?.row === rowIdx && activeCell?.col === colIdx && "scale-[1.01]"
                          )}>
                            {renderCell(col, row, rowIdx, colIdx)}
                          </div>
                        </td>
                      ))}
                      {!readOnly && (
                        <td className="px-2 text-center border-r-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRow(rowIdx)}
                            className="h-8 w-8 rounded-full text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover/row:opacity-100 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER SUMMARY — Premium Glassmorphic Card */}
      {rows.length > 0 && showSummary && columns.some(c => c.key === 'total') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="md:col-start-2 md:col-span-2 relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20 -z-10" />
            <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden divide-y divide-border/10">
              <div className="grid grid-cols-2 p-6 transition-all hover:bg-white/[0.02]">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    BOQ Subtotal
                  </span>
                  <p className="text-xs text-muted-foreground/60 italic">Excluding all taxes and levies</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-foreground tabular-nums">
                    {formatCurrencyValue(totals.subtotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 p-6 transition-all hover:bg-white/[0.02]">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Aggregated GST
                  </span>
                  <p className="text-xs text-muted-foreground/60 italic">GST computed line-by-line</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary tabular-nums">
                    {formatCurrencyValue(totals.totalGST)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 p-8 bg-gradient-to-br from-emerald-600/10 via-teal-600/5 to-transparent relative overflow-hidden group/final">
                <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="space-y-1 relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">
                    Grand Total
                  </span>
                  <p className="text-sm font-medium text-foreground/80">Net commercial valuation</p>
                </div>
                <div className="text-right relative z-10">
                  <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums drop-shadow-sm tracking-tighter">
                    {formatCurrencyValue(totals.finalAmount)}
                  </span>
                  <div className="h-1 w-24 bg-emerald-500/30 ml-auto mt-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full animate-progress" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableGrid;

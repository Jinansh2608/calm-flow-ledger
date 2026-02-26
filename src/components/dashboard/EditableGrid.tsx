// ============================================================
// EDITABLE GRID COMPONENT
// Client 2 BOQ-style quotation grid
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

const EditableGrid = ({
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
}: EditableGridProps) => {
  const columns = QUOTATION_COLUMNS;
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [suggestions, setSuggestions] = useState<SystemItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionRowIdx, setSuggestionRowIdx] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // ============================================================
  // KEYBOARD NAVIGATION
  // ============================================================
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
        if (nextCol >= 0 && nextCol < columns.length) {
          setActiveCell({ row: rowIdx, col: nextCol });
          const key = `${rowIdx}-${nextCol}`;
          setTimeout(() => inputRefs.current.get(key)?.focus(), 0);
        } else if (!e.shiftKey && nextCol >= columns.length && rowIdx < rows.length - 1) {
          setActiveCell({ row: rowIdx + 1, col: 0 });
          const key = `${rowIdx + 1}-0`;
          setTimeout(() => inputRefs.current.get(key)?.focus(), 0);
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (rowIdx < rows.length - 1) {
          setActiveCell({ row: rowIdx + 1, col: colIdx });
          const key = `${rowIdx + 1}-${colIdx}`;
          setTimeout(() => inputRefs.current.get(key)?.focus(), 0);
        }
      }

      if (e.key === "ArrowDown" && rowIdx < rows.length - 1) {
        setActiveCell({ row: rowIdx + 1, col: colIdx });
        const key = `${rowIdx + 1}-${colIdx}`;
        setTimeout(() => inputRefs.current.get(key)?.focus(), 0);
      }

      if (e.key === "ArrowUp" && rowIdx > 0) {
        setActiveCell({ row: rowIdx - 1, col: colIdx });
        const key = `${rowIdx - 1}-${colIdx}`;
        setTimeout(() => inputRefs.current.get(key)?.focus(), 0);
      }
    },
    [columns, rows.length]
  );

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
  // AUTOFILL LOGIC
  // ============================================================
  const handleSearchInput = useCallback(
    (rowIdx: number, colKey: string, value: string) => {
      handleCellChange(rowIdx, colKey, value);

      if (value.length >= 2) {
        const matches = SAMPLE_ITEMS.filter((item) =>
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
    [handleCellChange]
  );

  const handleSelectSuggestion = useCallback(
    (rowIdx: number, item: SystemItem) => {
      const updated = [...rows];
      const row = { ...updated[rowIdx] };

      row.name = item.name;
      row.hsn_sac_code = item.hsn_sac_code || row.hsn_sac_code || '';
      row.type_of_boq = item.type_of_boq || row.type_of_boq || '';
      row.units = item.units || row.units || '';
      row.price = item.price ?? row.price ?? 0;
      row.tax = item.tax ?? row.tax ?? 18;

      updated[rowIdx] = row;
      onRowsChange(updated);
      setShowSuggestions(false);
      setSuggestions([]);
    },
    [rows, onRowsChange]
  );

  // ============================================================
  // ROW MANAGEMENT
  // ============================================================
  const addRow = useCallback(() => {
    const newRow = createEmptyRow(rows.length);
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange]);

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

    // Read-only mode or Auto-calculated 'total'
    if (readOnly || col.key === "total") {
      let displayValue = value;
      
      if (col.key === "total") {
        const { rowGrand } = calculateRowTotals(row);
        displayValue = rowGrand;
      }

      return (
        <div
          className={cn(
            "px-4 py-3 text-sm tabular-nums font-medium transition-all duration-300",
            col.alignment === "right" && "text-right",
            col.alignment === "center" && "text-center",
            col.key === "total" && "text-primary font-bold bg-primary/5"
          )}
        >
          {formatValue(displayValue, col.format)}
        </div>
      );
    }

    // Dropdown
    if (col.inputType === "dropdown") {
      return (
        <Select
          value={String(value || "")}
          onValueChange={(val) => handleCellChange(rowIdx, col.key, val)}
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
      return (
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
              onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
              onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
              className={cn(
                "h-11 border-0 bg-transparent text-sm rounded-none pl-8 focus:ring-0 focus:bg-primary/[0.02] font-semibold tracking-tight transition-all duration-300",
                compact && "h-8 text-xs pl-7"
              )}
              placeholder="Search or specify item..."
            />
          </div>
          {showSuggestions && suggestionRowIdx === rowIdx && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[60] bg-popover/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-border/10 bg-muted/30">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2">Matches in Registry</p>
              </div>
              <div className="overflow-y-auto max-h-54 py-1">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-primary/10 transition-all flex items-center justify-between group/suggest"
                    onClick={() => handleSelectSuggestion(rowIdx, item)}
                    type="button"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground group-hover/suggest:text-primary transition-colors">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter">REF: {item.hsn_sac_code || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type_of_boq && (
                        <Badge variant="secondary" className="text-[8px] h-4 font-black uppercase tracking-tighter">
                          {item.type_of_boq}
                        </Badge>
                      )}
                      {item.price !== undefined && (
                        <span className="text-xs font-bold text-foreground/80 tabular-nums">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
        onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
        onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
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
    <div ref={gridRef} className={cn("space-y-4", className)}>
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
                <tr className="bg-muted/30 border-b border-border/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap border-r border-border/10 last:border-r-0",
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
              <tbody className="divide-y divide-border/10">
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
                            "border-r border-border/10 last:border-r-0 relative transition-all duration-300",
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
      {rows.length > 0 && (
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

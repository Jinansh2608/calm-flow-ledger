// ============================================================
// PROCUREMENT BUNDLE DIALOG
// Creates a category-based grouping of master orders
// ============================================================

import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  Package, 
  Building2, 
  Settings2, 
  Plus, 
  Check, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Tag,
  Briefcase,
  Layers,
  ShieldCheck,
  Zap,
  Filter,
  LayoutGrid,
  Calendar,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import EditableGrid from "@/components/dashboard/EditableGrid";
import {
  PROCUREMENT_COLUMNS,
} from "@/config/DynamicColumnConfig";
import { API_CONFIG } from "@/config/api";
import { vendorService } from "@/services/vendorService";
import { apiRequest } from "@/services/api";
import { useDashboard } from "@/contexts/DashboardContext";
import { projectService } from "@/services/projectService";

interface VendorMasterDialogProps {
  projectId?: number;
  onSuccess?: () => void;
  initialData?: any;
  trigger?: React.ReactNode;
  availableLineItems?: any[];
}

const VendorMasterDialog = ({ projectId, onSuccess, initialData, trigger, availableLineItems }: VendorMasterDialogProps) => {
   const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedProjectItems, setSelectedProjectItems] = useState<number[]>([]);
  
  const { projects } = useDashboard();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId);
  const [projectLineItems, setProjectLineItems] = useState<any[]>(availableLineItems || []);

  // Bundle level fields
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [poNumber, setPoNumber] = useState("");

  // Line items (Individual Orders)
  const [orderRows, setOrderRows] = useState<Record<string, any>[]>([]);
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);

   useEffect(() => {
    const fetchVendors = async () => {
      const result = await vendorService.getAllVendors();
      if (result.status === "SUCCESS") {
        setAvailableVendors(result.vendors || []);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    const fetchProjectItems = async () => {
      if (selectedProjectId && !availableLineItems) {
        try {
          const items = await projectService.getProjectLineItems(selectedProjectId);
          setProjectLineItems(items || []);
        } catch (error) {
          console.error("Failed to fetch project line items:", error);
        }
      } else if (availableLineItems) {
        setProjectLineItems(availableLineItems);
      }
    };
    fetchProjectItems();
  }, [selectedProjectId, availableLineItems]);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || "");
      setDescription(initialData.description || "");
      setPoNumber(initialData.po_number || "");
      if (initialData.line_items) {
        setOrderRows(initialData.line_items.map((r: any) => ({ 
          ...r, 
          _id: crypto.randomUUID(),
          vendor_name: r.vendor_name // Used for display in grid
        })));
      }
    } else {
      // Start with 3 empty rows
      setOrderRows([
        { _id: crypto.randomUUID(), item_name: "", quantity: 1, unit_price: 0, status: 'pending', delivery_progress: 0 },
        { _id: crypto.randomUUID(), item_name: "", quantity: 1, unit_price: 0, status: 'pending', delivery_progress: 0 },
        { _id: crypto.randomUUID(), item_name: "", quantity: 1, unit_price: 0, status: 'pending', delivery_progress: 0 },
      ]);
    }
  }, [initialData, open]);

  const mappedRecommendations = useMemo(() => {
    const recs: Record<string, any[]> = {
      item_name: [],
      vendor_name: []
    };

     if (projectLineItems) {
      recs.item_name = projectLineItems.map(item => ({
        id: `project-item-${item.id}`,
        name: item.description || item.item_name || 'Item',
        price: item.unit_price,
      }));
    }

    if (availableVendors) {
      recs.vendor_name = availableVendors.map(v => ({
        id: `vendor-${v.id}`,
        name: v.name,
      }));
    }

    return recs;
  }, [projectLineItems, availableVendors]);

  const resetForm = useCallback(() => {
    setCategory("");
    setDescription("");
    setPoNumber("");
    setOrderRows([
        { _id: crypto.randomUUID(), item_name: "", quantity: 1, unit_price: 0, status: 'pending', delivery_progress: 0 },
      ]);
  }, []);

  const handleSave = useCallback(async () => {
     const targetProjectId = selectedProjectId || projectId;
    if (!targetProjectId) {
      toast({ title: "Error", description: "Project selection is required", variant: "destructive" });
      return;
    }

    const validRows = orderRows.filter(row => row.item_name && row.item_name.trim());
    if (validRows.length === 0) {
      toast({ title: "Error", description: "At least one order item is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create/Update the Master Order Bundle
       const bundlePayload = {
        category,
        description,
        po_number: poNumber || `BUNDLE-${category.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        po_date: new Date().toISOString().split('T')[0],
        project_id: targetProjectId
      };

      const isEdit = !!initialData?.id;
      const bundleUrl = isEdit 
        ? `/projects/${targetProjectId}/vendor-orders/${initialData.id}` 
        : `/projects/${targetProjectId}/vendor-orders`;
      
      const response = await apiRequest<any>(bundleUrl, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(bundlePayload),
      });

      console.log("[VendorMasterDialog] Bundle Save Response:", response);

      if (response.status === "ERROR") {
        throw new Error(response.message || "Failed to save procurement bundle");
      }
      
      // Handle both wrapped { data: { ... } } and direct { ... } responses
      const result = response.data || response;
      const bundleId = result?.vendor_order?.id || result?.id || result?.vendor_order_id || initialData?.id;

      if (!bundleId) {
        console.error("[VendorMasterDialog] Could not find bundleId in:", { response, result, initialData });
        throw new Error("Failed to retrieve bundle ID from server");
      }

      // 2. Process Line Items (Individual Orders)
      for (const row of validRows) {
        // If it's a new row (no id), create it
        if (!row.id) {
            const linePayload = {
                item_name: row.item_name,
                quantity: Number(row.quantity),
                unit_price: Number(row.unit_price),
                status: row.status || 'pending',
                order_date: row.order_date || new Date().toISOString().split('T')[0],
                client_line_item_id: row.client_line_item_id,
                vendor_id: row.vendor_id
            };

            await apiRequest<any>(`/vendor-orders/${bundleId}/line-items`, {
                method: "POST",
                body: JSON.stringify(linePayload),
            });
        }
      }

      toast({
        title: isEdit ? "Bundle Updated" : "Bundle Created",
        description: `Successfully processed the ${category} procurement bundle.`,
      });
      
      resetForm();
      if (onSuccess) onSuccess();
       setOpen(false);
    } catch (error) {
      console.error("Save bundle error:", error);
      toast({ title: "Error", description: "Failed to finalize procurement bundle", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [category, description, poNumber, orderRows, resetForm, projectId, selectedProjectId, initialData]);

  // Handle grid change 
  const handleGridChange = (newRows: Record<string, any>[]) => {
    setOrderRows(newRows);
  };

  const handleGridDelete = (rowIdx: number) => {
    const updated = [...orderRows];
    updated.splice(rowIdx, 1);
    setOrderRows(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 text-[10px] font-black uppercase tracking-widest border-indigo-500/20 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-md rounded-xl px-6"
          >
            <Plus className="h-4 w-4" />
            Create Procurement Bundle
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[1400px] w-[95vw] max-h-[95vh] overflow-hidden p-0 border-none shadow-2xl rounded-[2.5rem] bg-[#f8fafc] dark:bg-[#020617]">
        <header className="px-10 py-10 border-b bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                Master Procurement Bundle
              </DialogTitle>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 h-6 text-[10px] font-black uppercase tracking-widest">
                  Bundle Orchestrator
                </Badge>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold opacity-60">
                   Category-Based Logistic Grouping
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Plus className="h-6 w-6 rotate-45 text-slate-400" />
             </Button>
          </div>
        </header>

        <div className="overflow-y-auto max-h-[calc(95vh-180px)] custom-scrollbar p-10 space-y-12">
          {/* TOP SECTION: BUNDLE IDENTITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="space-y-4 pt-2">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                <Tag className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Bundle Identity</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                 Define the category and global tracking number for this procurement grouping.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="space-y-3">
                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Logistics Category <span className="text-rose-500">*</span></Label>
                 <Select value={category} onValueChange={setCategory}>
                   <SelectTrigger className="h-14 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 font-black text-lg italic tracking-tight">
                     <SelectValue placeholder="Select Category" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-indigo-500/10">
                      <SelectItem value="Furniture" className="font-bold py-3">Furniture / Movables</SelectItem>
                      <SelectItem value="Electrical" className="font-bold py-3">Electrical / Lighting</SelectItem>
                      <SelectItem value="Fixtures" className="font-bold py-3">Fixtures / Sanitary</SelectItem>
                      <SelectItem value="Branding" className="font-bold py-3">Branding / Signage</SelectItem>
                      <SelectItem value="Civil" className="font-bold py-3">Civil / Furnishing</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-3">
                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Project Assignment <span className="text-rose-500">*</span></Label>
                 <Select 
                    value={selectedProjectId?.toString()} 
                    onValueChange={(val) => setSelectedProjectId(Number(val))}
                    disabled={!!projectId || !!initialData?.id}
                >
                   <SelectTrigger className="h-14 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 font-black text-lg italic tracking-tight">
                     <SelectValue placeholder="Select Project" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-indigo-500/10 max-h-[300px]">
                      {projects.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()} className="font-bold py-3">
                              {p.name}
                          </SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-3">
                 <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Bundle Identifier (PO #)</Label>
                 <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                    <Input 
                      value={poNumber} 
                      onChange={(e) => setPoNumber(e.target.value)} 
                      placeholder="e.g. BNDL-FUR-001" 
                      className="h-14 pl-12 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 font-bold text-lg" 
                    />
                 </div>
               </div>

               <div className="md:col-span-2 space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Internal Reference / Description</Label>
                  <Input 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe the scope of this bundle..." 
                    className="h-14 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 font-medium" 
                  />
               </div>
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* GRID SECTION: INDIVIDUAL ORDERS */}
          <div className="space-y-8">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-5">
                   <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Package className="h-6 w-6 text-white" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Individual Order Sequence</h4>
                       <p className="text-slate-500 text-sm font-medium">Define specific line items, batch quantities, and projected unit rates for this bundle.</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    {projectLineItems && projectLineItems.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-6 gap-2 text-[10px] font-black uppercase tracking-widest border-indigo-500/10 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all rounded-xl"
                          onClick={() => setIsPickerOpen(true)}
                        >
                          <Filter className="h-3.5 w-3.5" />
                          Import Project Specifications
                        </Button>
                    )}
                    <Badge variant="outline" className="h-10 px-6 rounded-2xl border-2 border-indigo-500/20 bg-indigo-50/50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">
                       {orderRows.filter(r => r.item_name).length} Items Detected
                    </Badge>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden p-2">
                 <EditableGrid 
                   columns={PROCUREMENT_COLUMNS}
                   rows={orderRows}
                   onRowsChange={handleGridChange}
                   minHeight="500px"
                   title="Bundle Ledger"
                   recommendations={mappedRecommendations}
                 />
             </div>
          </div>

          {/* ITEM PICKER DIALOG */}
          <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <DialogContent className="max-w-2xl rounded-[2rem]">
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Select Project Line Items</DialogTitle>
                  <DialogDescription>Choose existing items from the project to include in this procurement bundle.</DialogDescription>
               </DialogHeader>
                <div className="py-6 space-y-4 max-h-[50vh] overflow-y-auto">
                  {projectLineItems?.filter(item => !orderRows.some(row => row.client_line_item_id === item.id)).map((item) => (
                     <div 
                        key={item.id} 
                        className={cn(
                           "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                           selectedProjectItems.includes(item.id) 
                              ? "bg-indigo-50 border-indigo-500/30" 
                              : "hover:bg-slate-50 border-transparent"
                        )}
                        onClick={() => {
                           setSelectedProjectItems(prev => 
                              prev.includes(item.id) 
                                 ? prev.filter(id => id !== item.id) 
                                 : [...prev, item.id]
                           );
                        }}
                     >
                        <div className="flex items-center gap-4">
                           <div className={cn(
                              "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                              selectedProjectItems.includes(item.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                           )}>
                              {selectedProjectItems.includes(item.id) && <Check className="h-3 w-3 text-white" />}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">{item.description}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.quantity} units @ {formatCurrency(item.unit_price)}</p>
                           </div>
                        </div>
                        <Badge variant="outline" className="font-black text-[10px]">{formatCurrency(item.amount)}</Badge>
                     </div>
                  ))}
                   {(!projectLineItems || projectLineItems.filter(item => !orderRows.some(row => row.client_line_item_id === item.id)).length === 0) && (
                     <div className="py-20 flex flex-col items-center justify-center opacity-40">
                        <Zap className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No available project items</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">All specifications have been imported or none exist.</p>
                     </div>
                  )}
               </div>
               <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => {
                     setSelectedProjectItems([]);
                     setIsPickerOpen(false);
                  }}>Cancel</Button>
                   <Button 
                     className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-8"
                     onClick={() => {
                        const itemsToAdd = projectLineItems?.filter(item => selectedProjectItems.includes(item.id));
                        if (itemsToAdd && itemsToAdd.length > 0) {
                           const newRows = itemsToAdd.map(item => ({
                              _id: crypto.randomUUID(),
                              item_name: item.description,
                              quantity: item.quantity,
                              unit_price: item.unit_price,
                              status: 'pending',
                              delivery_progress: 0,
                              client_line_item_id: item.id // Track back to original item
                           }));
                           
                           // Merge with existing rows, removing empty ones if they are just placeholders
                           const filteredExisting = orderRows.filter(r => r.item_name && r.item_name.trim());
                           setOrderRows([...filteredExisting, ...newRows]);
                           toast({ title: "Items Added", description: `${itemsToAdd.length} items merged into bundle sequence.` });
                        }
                        setSelectedProjectItems([]);
                        setIsPickerOpen(false);
                     }}
                  >
                     Add Selected Items
                  </Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <footer className="px-10 py-8 border-t bg-white dark:bg-slate-900 flex items-center justify-between sticky bottom-0 z-50">
           <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-full border-2 border-slate-100 flex items-center justify-center">
                 <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Enterprise Validation Active</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Registry Consistency Guaranteed</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setOpen(false)} className="h-14 px-10 text-[11px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all rounded-2xl">
                 Abort Session
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="h-14 px-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-600/30 gap-3 transition-all active:scale-95 disabled:grayscale"
              >
                {isSaving ? (
                    <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        Finalize Procurement {category && `[${category}]`}
                        <ChevronRight className="h-4 w-4" />
                    </>
                )}
              </Button>
           </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

export default VendorMasterDialog;

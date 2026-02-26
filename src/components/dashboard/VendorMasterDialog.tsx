// ============================================================
// VENDOR MASTER DIALOG — Refined Premium UI
// Vendor creation with Movable/Furnishing type + project-specific rate config
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
  Filter
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
import { cn } from "@/lib/utils";
import EditableGrid from "@/components/dashboard/EditableGrid";
import {
  createEmptyRow,
} from "@/config/DynamicColumnConfig";
import { API_CONFIG } from "@/config/api";

type VendorType = "movable" | "furnishing";

interface VendorMasterDialogProps {
  projectId?: number;
  projectLineItems?: any[];
  onSuccess?: () => void;
  initialData?: any;
  trigger?: React.ReactNode;
}

const VendorMasterDialog = ({ projectId, projectLineItems = [], onSuccess, initialData, trigger }: VendorMasterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [vendorName, setVendorName] = useState("");
  const [vendorType, setVendorType] = useState<VendorType | "">("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [rateRows, setRateRows] = useState<Record<string, any>[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);

  useEffect(() => {
    if (initialData) {
      setVendorName(initialData.name || "");
      setVendorType(initialData.master_type || "");
      setContactPerson(initialData.contact_person || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      if (initialData.rate_configuration) {
        setRateRows(initialData.rate_configuration.map((r: any) => ({ ...r, _id: crypto.randomUUID() })));
      }
    }
  }, [initialData]);

  // Map project line items to a format compatible with the creator
  const availableItems = useMemo(() => {
    return projectLineItems.map(item => ({
      id: String(item.id),
      name: item.description || item.name || 'Unknown Item',
      hsn_sac_code: item.hsn_sac_code || '',
      type_of_boq: item.type_of_boq || (item.category === 'movable' ? 'Movable' : 'Non Movable'),
      units: item.units || 'Nos',
      price: item.unit_price || item.price || 0,
      tax: item.tax || 18
    }));
  }, [projectLineItems]);

  const handleAssignItems = useCallback(
    (itemIds: string[]) => {
      setSelectedItems(itemIds);
      const newRows = itemIds.map((id, idx) => {
        const item = availableItems.find((i) => i.id === id);
        if (!item) return createEmptyRow(idx);

        return {
          _id: crypto.randomUUID(),
          name: item.name,
          hsn_sac_code: item.hsn_sac_code || '',
          type_of_boq: item.type_of_boq || '',
          quantity: 1,
          units: item.units || '',
          price: item.price ?? 0,
          tax: item.tax || 18
        };
      });

      setRateRows(newRows);
      setShowItemSelector(false);
    },
    [availableItems]
  );

  const toggleItem = useCallback(
    (id: string) => {
      const updated = selectedItems.includes(id)
        ? selectedItems.filter((i) => i !== id)
        : [...selectedItems, id];
      setSelectedItems(updated);
    },
    [selectedItems]
  );

  const resetForm = useCallback(() => {
    setVendorName("");
    setVendorType("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setRateRows([]);
    setSelectedItems([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!vendorName.trim()) {
      toast({ title: "Error", description: "Vendor name is required", variant: "destructive" });
      return;
    }
    if (!vendorType) {
      toast({ title: "Error", description: "Vendor type is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: vendorName,
        contact_person: contactPerson,
        email: email,
        phone: phone,
        address: address,
        master_type: vendorType,
        project_id: projectId,
        rate_configuration: rateRows.map(row => ({
          name: row.name,
          hsn_sac_code: row.hsn_sac_code,
          type_of_boq: row.type_of_boq,
          units: row.units,
          price: row.price,
          tax: row.tax
        }))
      };

      // Dynamic operation based on initialData
      const isEdit = !!initialData?.id;
      const url = isEdit 
        ? `${API_CONFIG.BASE_URL}/vendors/${initialData.id}` 
        : `${API_CONFIG.BASE_URL}/vendors`;
      
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'save'} vendor`);

      toast({
        title: isEdit ? "Vendor Updated" : "Vendor Created",
        description: isEdit 
          ? `Successfully updated ${vendorName}.`
          : `Successfully registered ${vendorName} as a Master Vendor.`,
      });
      
      resetForm();
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (error) {
      console.error("Save vendor error:", error);
      toast({ title: "Error", description: "Failed to sync with Master Registry", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [vendorName, vendorType, contactPerson, email, phone, address, rateRows, resetForm, projectId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 text-xs font-black uppercase tracking-widest border-indigo-500/20 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-md rounded-xl px-6"
          >
            <Zap className="h-4 w-4 fill-indigo-600 animate-pulse" />
            Master Vendor Registry
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[1600px] w-[95vw] max-h-[95vh] overflow-hidden p-0 border-none shadow-2xl rounded-[2rem] bg-[#f8fafc] dark:bg-[#020617]">
        {/* HEADER — Inspired by CreateQuotation */}
        <header className="px-10 py-8 border-b bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-[1.25rem] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Master Vendor Registry</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none px-2 h-5 text-[9px] font-black uppercase tracking-widest">
                  Vendor Onboarding
                </Badge>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                  Project Mode • Site Config Sync
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <div className="h-5 w-5 rotate-45 border-2 border-slate-400 rounded-sm" />
             </Button>
          </div>
        </header>

        <div className="overflow-y-auto max-h-[calc(95vh-160px)] custom-scrollbar p-10 space-y-12">
          {/* SECTION 1: CREDENTIALS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
             <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                   <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Legal Identity</h4>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">Official business registration and categorization for taxation compliance.</p>
                </div>
             </div>

             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Business Name <span className="text-rose-500">*</span></Label>
                  <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Acme Interiors LLC" className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Industry Specialization <span className="text-rose-500">*</span></Label>
                  <Select value={vendorType} onValueChange={(v) => setVendorType(v as VendorType)}>
                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-indigo-500/10"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movable" className="font-bold"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" />Movable (Furniture)</div></SelectItem>
                      <SelectItem value="furnishing" className="font-bold"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500" />Furnishing (Civil)</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Principal Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Registered office location..." className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 pl-11 rounded-xl font-medium" />
                  </div>
                </div>
             </div>
          </div>

          <Separator className="opacity-40" />

          {/* SECTION 2: CONTACTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
             <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
                   <Mail className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Communication Node</h4>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">Point of contact for automated purchase orders and billing notifications.</p>
                </div>
             </div>

             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Representative</Label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full Name" className="h-11 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Email</Label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="office@vendor.com" className="h-11 pl-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Connectivity</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="h-11 pl-11 rounded-xl" />
                  </div>
                </div>
             </div>
          </div>

          <Separator className="opacity-40" />

          {/* SECTION 3: LINE ITEM MAPPING (Project Specific) */}
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                    <Filter className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Project Catalog Mapping</h4>
                    <p className="text-slate-500 text-xs font-medium">Restricted to line items discovered in Current Project context.</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowItemSelector(!showItemSelector)} 
                  className={cn(
                    "h-10 text-[10px] font-black uppercase tracking-widest gap-2 transition-all border-emerald-500/20 rounded-xl px-6",
                    showItemSelector ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  {showItemSelector ? <Check className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  {showItemSelector ? "Close Selector" : "Discover Project Items"}
                </Button>
             </div>

             {showItemSelector && (
               <div className="border border-emerald-500/10 rounded-[2rem] bg-emerald-50/20 dark:bg-emerald-950/10 p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-tight">Active Project Specifications</p>
                      <p className="text-[11px] text-emerald-800/60 dark:text-emerald-400/60 font-medium">Map this vendor to any of the {availableItems.length} items identified for this project.</p>
                  </div>
                  
                  {availableItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                      {availableItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            "flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all group relative overflow-hidden",
                            selectedItems.includes(item.id)
                              ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10"
                              : "bg-background border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-white"
                          )}
                        >
                          <div className={cn(
                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all", 
                            selectedItems.includes(item.id) ? "bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/30" : "border-slate-200 dark:border-slate-700"
                          )}>
                            {selectedItems.includes(item.id) && <Check className="h-3.5 w-3.5 text-white stroke-[4px]" />}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-xs font-black text-slate-900 dark:text-white opacity-90 group-hover:opacity-100">{item.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{item.type_of_boq}</span>
                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{item.units}</span>
                              </div>
                          </div>
                          {item.price && (
                            <div className="flex flex-col items-end shrink-0 ml-2">
                               <span className="text-[10px] font-black text-emerald-600">₹{item.price.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center gap-2">
                       <Plus className="h-8 w-8 text-emerald-300" />
                       <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">No Line Items Found</p>
                       <p className="text-[10px] text-slate-400">Please add line items to the project first.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-emerald-500/10">
                    <div className="flex items-center gap-2">
                       <Badge className="bg-emerald-500 text-white rounded-lg h-6 px-3 text-[10px] font-black">
                          {selectedItems.length} SELECTED
                       </Badge>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ready to map</span>
                    </div>
                    <Button size="sm" onClick={() => handleAssignItems(selectedItems)} disabled={selectedItems.length === 0} className="h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transform active:scale-95 transition-all">
                      Deploy Config to Grid
                    </Button>
                  </div>
               </div>
             )}

             {/* RATE GRID SECTION */}
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-1 transition-all hover:shadow-2xl">
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-border/50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Rate Registry</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Formalized Unit Cost Configuration</p>
                      </div>
                   </div>
                   {vendorType && (
                      <Badge variant="outline" className={cn("h-7 px-4 rounded-xl text-[10px] font-black border-2", vendorType === "movable" ? "text-blue-600 border-blue-500/20 bg-blue-50" : "text-amber-600 border-amber-500/20 bg-amber-50")}>
                        {vendorType.toUpperCase()} CLASS
                      </Badge>
                   )}
                </div>
                <div className="p-6">
                  <EditableGrid
                      rows={rateRows}
                      onRowsChange={setRateRows}
                      showExport={false}
                      minHeight="500px"
                      allowAddRows={false}
                      title="Rate Registry"
                  />
                </div>
             </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="px-10 py-6 border-t bg-white dark:bg-slate-900 flex items-center justify-between sticky bottom-0 z-50">
           <div className="flex items-center gap-4 text-slate-400">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-[9px] font-black uppercase tracking-widest max-w-[200px] leading-tight opacity-60">
                Master vendor data is persistent across all future procurement cycles.
              </p>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => { resetForm(); setOpen(false); }} className="h-12 px-8 text-[11px] font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-all">Cancel</Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-indigo-600 shadow-2xl shadow-indigo-600/20 gap-3 transition-all active:scale-95 disabled:grayscale"
              >
                {isSaving ? (
                    <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Zap className="h-5 w-5 fill-current" />
                        Finalize Registry
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

// ============================================================
// VENDOR PO TRACKING & MANAGEMENT
// Dual-view system for Category-based and Vendor-based management
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { 
  Package, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  LayoutGrid, 
  ListFilter,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Loader2,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Search,
  Filter,
  X,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { vendorService } from "@/services/vendorService";
import { poService } from "@/services/poService";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "@/hooks/use-toast";
import VendorMasterDialog from "./VendorMasterDialog";
import { VendorOrderDetails } from "./VendorOrderDetails";
import ConfirmDialog from "./ConfirmDialog";
import { VendorOrder } from "@/types";

interface CategoryBundle {
  category: string;
  orders: VendorOrder[];
  total_value: number;
  order_count: number;
}

interface VendorBundle {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  orders: VendorOrder[];
  total_value: number;
  order_count: number;
}

const VendorMasterDashboard = ({ projectId }: { projectId?: number }) => {
  const [viewMode, setViewMode] = useState<'categories' | 'vendors'>('categories');
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', email: '', phone: '' });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedVendor, setExpandedVendor] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation States
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<{ isOpen: boolean; orderId: number; projectId: number }>({ isOpen: false, orderId: 0, projectId: 0 });
  const [confirmDeleteVendor, setConfirmDeleteVendor] = useState<{ isOpen: boolean; vendorId: number }>({ isOpen: false, vendorId: 0 });

  const { refreshData, categoryBundles, vendorBundles, loading: globalLoading } = useDashboard();

  const filteredCategories = useMemo(() => {
    let result = categoryBundles;
    if (projectId) {
      result = result.map((cat: CategoryBundle) => {
        const projectOrders = cat.orders.filter(o => o.project_id === projectId);
        return {
          ...cat,
          orders: projectOrders,
          order_count: projectOrders.length,
          total_value: projectOrders.reduce((sum, o) => sum + (o.po_value || o.amount || 0), 0)
        };
      }).filter((cat: CategoryBundle) => cat.order_count > 0);
    }
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter(cat => 
        cat.category.toLowerCase().includes(search) || 
        cat.orders.some(o => o.po_number?.toLowerCase().includes(search))
      );
    }
    return result;
  }, [categoryBundles, projectId, searchQuery]);

  const filteredVendors = useMemo(() => {
    let result = vendorBundles;
    if (projectId) {
      result = result.map((v: VendorBundle) => {
        const projectOrders = v.orders.filter(o => o.project_id === projectId);
        return {
          ...v,
          orders: projectOrders,
          order_count: projectOrders.length,
          total_value: projectOrders.reduce((sum, o) => sum + (o.po_value || o.amount || 0), 0)
        };
      }).filter(v => v.order_count > 0);
    }
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(search) || 
        v.email?.toLowerCase().includes(search) ||
        v.orders.some(o => o.po_number?.toLowerCase().includes(search))
      );
    }
    return result;
  }, [vendorBundles, projectId, searchQuery]);

  const handleSuccess = async () => {
    await refreshData(true);
  };

  const handleCreateVendor = async () => {
    if (!newVendor.name) return;
    try {
        await vendorService.createVendor(newVendor);
        toast({ title: "Success", description: "Vendor created successfully" });
        setIsCreateVendorOpen(false);
        setNewVendor({ name: '', email: '', phone: '' });
        refreshData(true);
    } catch (error) {
        toast({ title: "Error", description: "Failed to create vendor", variant: "destructive" });
    }
  };

  const handleDeleteOrder = async () => {
    const { orderId, projectId: projId } = confirmDeleteOrder;
    try {
        await poService.deleteVendorOrder(projId, orderId);
        toast({ title: "Success", description: "Order deleted successfully" });
        await refreshData(true);
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    }
  };

  const handleDeleteVendor = async () => {
    const { vendorId } = confirmDeleteVendor;
    try {
        await vendorService.deleteVendor(vendorId);
        toast({ title: "Success", description: "Vendor removed" });
        await refreshData(true);
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete vendor", variant: "destructive" });
    }
  };

  if (globalLoading && categoryBundles.length === 0) return (
    <div className="h-64 flex items-center justify-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Dynamic Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
           <Button 
            variant={viewMode === 'categories' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('categories')}
            className={cn(
                "h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'categories' ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-indigo-600"
            )}
           >
             <Layers className="h-3.5 w-3.5 mr-2" />
             Categories
           </Button>
           <Button 
            variant={viewMode === 'vendors' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('vendors')}
            className={cn(
                "h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'vendors' ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-indigo-600"
            )}
           >
             <Building2 className="h-3.5 w-3.5 mr-2" />
             Vendors
           </Button>
        </div>

        <div className="flex items-center gap-3">
           <Button 
            variant="outline" 
            onClick={() => setIsCreateVendorOpen(true)}
            className="h-11 rounded-2xl border-indigo-500/20 text-indigo-600 font-black text-[10px] uppercase tracking-widest gap-2 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
           >
             <UserPlus className="h-4 w-4" />
             Create Vendor
           </Button>
           <VendorMasterDialog onSuccess={handleSuccess} projectId={projectId} />
        </div>
      </div>

      <div className="relative group max-w-2xl">
         <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
         <Input 
            placeholder={`Search ${viewMode === 'categories' ? 'bundles' : 'vendors'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-6 rounded-[1.5rem] bg-white dark:bg-slate-900 border-slate-200 font-bold text-sm shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all"
         />
      </div>

      <div className="space-y-4">
        {viewMode === 'categories' ? (
          filteredCategories.length > 0 ? (
            filteredCategories.map((bundle) => {
                const isExpanded = expandedCategory === bundle.category;
                return (
                    <div 
                        key={bundle.category}
                        className={cn(
                        "group relative overflow-hidden transition-all duration-500 rounded-[2rem] border",
                        isExpanded 
                            ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-500/10" 
                            : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl"
                        )}
                    >
                        <div 
                        className="p-8 flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedCategory(isExpanded ? null : bundle.category)}
                        >
                        <div className="flex items-center gap-6">
                            <div className={cn(
                            "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border border-slate-100",
                            isExpanded ? "bg-indigo-600 scale-110 shadow-xl shadow-indigo-600/30" : "bg-white dark:bg-slate-800"
                            )}>
                            <Zap className={cn("h-7 w-7 transition-colors", isExpanded ? "text-white" : "text-indigo-600")} />
                            </div>
                            <div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                                {bundle.category}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                                <Badge className="bg-indigo-500/10 text-indigo-600 border-none px-2 h-5 text-[8px] font-black uppercase tracking-widest">
                                {bundle.order_count} Linked Order{bundle.order_count !== 1 ? 's' : ''}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Procurement Lifecycle
                                </span>
                            </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Value</span>
                                <p className="text-xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(bundle.total_value)}</p>
                            </div>
                            <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-500",
                            isExpanded ? "bg-indigo-50 border-indigo-200 rotate-180" : "bg-slate-50 border-slate-200"
                            )}>
                                <ChevronDown className={cn("h-5 w-5", isExpanded ? "text-indigo-600" : "text-slate-400")} />
                            </div>
                        </div>
                        </div>

                        {isExpanded && (
                        <div className="px-8 pb-8 pt-4 space-y-10 animate-in slide-in-from-top-4 duration-500">
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-1 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-inner">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PO Ref</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {bundle.orders.map((order) => (
                                    <tr key={order.id} className="group/row hover:bg-white dark:hover:bg-slate-900 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                                <Building2 className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white group-hover/row:text-indigo-600 transition-colors italic">
                                                {order.vendor_name || "Unassigned"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.po_number || "#PENDING"}</p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-sm font-black text-slate-800 dark:text-white italic tracking-tighter">{formatCurrency(order.po_value || order.amount || 0)}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <Badge className={cn(
                                        "h-5 text-[8px] font-black uppercase tracking-widest border-none px-2 rounded-md",
                                        order.work_status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                                        order.work_status === 'in_progress' ? "bg-amber-500/10 text-amber-600" :
                                        "bg-slate-500/10 text-slate-600"
                                        )}>
                                        {order.work_status || 'pending'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button 
                                                variant="ghost" size="sm" 
                                                className="h-8 px-4 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase tracking-widest"
                                                onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}
                                            >Inspect</Button>
                                            <Button 
                                                variant="ghost" size="icon" 
                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                                                onClick={() => handleDeleteOrder(order.id, order.project_id || 0)}
                                            ><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                        )}
                    </div>
                );
            })
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching category bundles</p>
            </div>
          )
        ) : (
          filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => {
                const isExpanded = expandedVendor === vendor.id;
                return (
                    <div 
                        key={vendor.id}
                        className={cn(
                            "group relative overflow-hidden transition-all duration-500 rounded-[2rem] border",
                            isExpanded 
                                ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-500/10" 
                                : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl"
                        )}
                    >
                        <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}>
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border border-slate-100",
                                    isExpanded ? "bg-indigo-600 scale-110 shadow-xl shadow-indigo-600/30" : "bg-white dark:bg-slate-800"
                                )}>
                                    <Building2 className={cn("h-7 w-7 transition-colors", isExpanded ? "text-white" : "text-indigo-600")} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                                        {vendor.name}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-1.5">
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <Mail className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{vendor.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <Phone className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{vendor.phone || 'No phone'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Commitment</span>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-black text-indigo-600 italic tracking-tighter">{formatCurrency(vendor.total_value)}</p>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none h-5 text-[8px] font-black">{vendor.order_count}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 text-rose-500 hover:bg-rose-50 group-hover:bg-rose-50/50"
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteVendor({ isOpen: true, vendorId: vendor.id }); }}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-500",
                                        isExpanded ? "bg-indigo-50 border-indigo-200 rotate-180" : "bg-slate-50 border-slate-200"
                                    )}>
                                        <ChevronDown className={cn("h-5 w-5", isExpanded ? "text-indigo-600" : "text-slate-400")} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="px-8 pb-8 pt-4 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-1 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-inner">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {vendor.orders.length > 0 ? vendor.orders.map(order => (
                                                <tr key={order.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <p className="text-sm font-black italic uppercase">{order.po_number || 'PENDING'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.category || 'General'}</p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-sm font-black tracking-tighter italic">{formatCurrency(order.po_value || order.amount || 0)}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <Badge className={cn(
                                                            "h-5 text-[8px] font-black uppercase tracking-widest px-2 rounded-md",
                                                            order.work_status === 'completed' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                        )}>
                                                            {order.work_status || 'pending'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button 
                                                                variant="ghost" size="sm" 
                                                                className="h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase tracking-widest"
                                                                onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}
                                                            >Inspect</Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shadow-sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmDeleteOrder({ isOpen: true, orderId: order.id, projectId: order.project_id || 0 });
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">No orders registered</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching vendor entities</p>
            </div>
          )
        )}
      </div>

      <VendorOrderDetails 
        open={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        vendorOrder={selectedOrder} 
        onSuccess={handleSuccess}
      />

      <Dialog open={isCreateVendorOpen} onOpenChange={setIsCreateVendorOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[2.5rem]">
            <DialogHeader className="px-10 pt-10 pb-6 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Initialize New Vendor Entity</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Procurement Registry</DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <div className="px-10 py-10 space-y-8 bg-white dark:bg-slate-900">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company / Individual Name</Label>
                        <Input 
                            value={newVendor.name}
                            onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                            placeholder="e.g. Apex Manufacturing Inc."
                            className="h-14 rounded-2xl font-black text-sm italic border-slate-200 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Coordinate</Label>
                            <Input 
                                type="email"
                                value={newVendor.email}
                                onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                                placeholder="vendor@system.com"
                                className="h-14 rounded-2xl font-bold text-sm border-slate-200 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Coordinate</Label>
                            <Input 
                                value={newVendor.phone}
                                onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                                placeholder="+91 XXX-XXX-XXXX"
                                className="h-14 rounded-2xl font-bold text-sm border-slate-200 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setIsCreateVendorOpen(false)} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest">Abort</Button>
                    <Button onClick={handleCreateVendor} className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/20">Authorize Vendor</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog 
        isOpen={confirmDeleteOrder.isOpen}
        onClose={() => setConfirmDeleteOrder({ ...confirmDeleteOrder, isOpen: false })}
        onConfirm={handleDeleteOrder}
        title="Remove Procurement Order?"
        description="This will permanently delete this bundle from your ledger and financial tracking. This action cannot be undone."
      />

      <ConfirmDialog 
        isOpen={confirmDeleteVendor.isOpen}
        onClose={() => setConfirmDeleteVendor({ ...confirmDeleteVendor, isOpen: false })}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor Entity?"
        description="Detaching this vendor will remove them from the registry. Historic orders will be preserved but marked as unassigned."
      />
    </div>
  );
};

export default VendorMasterDashboard;

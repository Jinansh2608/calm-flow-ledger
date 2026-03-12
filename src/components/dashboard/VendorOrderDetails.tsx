import { useState, useEffect, useCallback, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorOrder } from "@/types";
import { poService } from "@/services/poService";
import { vendorService } from "@/services/vendorService";
import { formatCurrency, cn } from "@/lib/utils";
import { 
    Loader2, Plus, Trash2, Edit, Package, Truck, CheckCircle2, Clock, Calendar, Building2, Zap, 
    ChevronRight, LayoutGrid, DollarSign, FileText, TrendingUp, CreditCard, Search, Check
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import EditableGrid from "@/components/dashboard/EditableGrid";
import { PROCUREMENT_COLUMNS } from "@/config/DynamicColumnConfig";
import { projectService } from "@/services/projectService";
import { apiRequest } from "@/services/api";

interface VendorOrderDetailsProps {
    open: boolean;
    onClose: () => void;
    vendorOrder: VendorOrder | null;
    onSuccess?: () => void;
}

export function VendorOrderDetails({ open, onClose, vendorOrder, onSuccess }: VendorOrderDetailsProps) {
    const [details, setDetails] = useState<VendorOrder | null>(vendorOrder);
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]); 
    const [paymentSummary, setPaymentSummary] = useState<any>(null);
    const [profitAnalysis, setProfitAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingItems, setIsSavingItems] = useState(false);
    const [availableVendors, setAvailableVendors] = useState<any[]>([]);
    const [projectLineItems, setProjectLineItems] = useState<any[]>([]);

    // Grid State
    const [orderRows, setOrderRows] = useState<any[]>([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [selectedProjectItems, setSelectedProjectItems] = useState<number[]>([]);

    // Payment Form State
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference: ''
    });

    const [isEditingVendor, setIsEditingVendor] = useState(false);
    const [headerVendorSearch, setHeaderVendorSearch] = useState('');
    const [showHeaderSuggestions, setShowHeaderSuggestions] = useState(false);

    useEffect(() => {
        const fetchVendors = async () => {
            const result = await vendorService.getAllVendors();
            if (result.status === "SUCCESS") {
                setAvailableVendors(result.vendors || []);
            }
        };
        fetchVendors();
    }, []);

    const fetchDetails = useCallback(async (bypassCache: boolean = false) => {
        if (!vendorOrder) return;
        setIsLoading(true);
        try {
            setDetails(vendorOrder);
            
            const results = await Promise.allSettled([
                poService.getVendorOrder(vendorOrder.id, bypassCache),
                poService.getVendorOrderLineItems(vendorOrder.id, bypassCache),
                poService.getVendorOrderPaymentSummary(vendorOrder.id, bypassCache),
                poService.getVendorOrderProfitAnalysis(vendorOrder.id, bypassCache)
            ]);
            
            const orderData = results[0].status === 'fulfilled' ? results[0].value : null;
            const itemsData = results[1].status === 'fulfilled' ? results[1].value : [];
            const paymentsData = results[2].status === 'fulfilled' ? results[2].value : null;
            const profitData = results[3].status === 'fulfilled' ? results[3].value : null;

            setDetails(orderData || vendorOrder);
            setLineItems(itemsData || []);
            setOrderRows(itemsData ? itemsData.map((r: any) => ({ ...r, _id: crypto.randomUUID() })) : []);
            setPayments(paymentsData?.payments || []);
            setPaymentSummary(paymentsData);
            setProfitAnalysis(profitData);

            if (orderData?.project_id) {
                const projectItems = await projectService.getProjectLineItems(orderData.project_id);
                setProjectLineItems(projectItems || []);
            }

        } catch (error) {
            console.error("Error fetching VO details:", error);
            setDetails(vendorOrder);
            toast({ title: "Error", description: "Failed to load details", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [vendorOrder]);

    useEffect(() => {
        if (open && vendorOrder) {
            fetchDetails();
        }
    }, [open, vendorOrder, fetchDetails]);

    const handleSaveItems = async () => {
        if (!details) return;
        setIsSavingItems(true);
        try {
            const validRows = orderRows.filter(row => row.item_name && row.item_name.trim());
            for (const row of validRows) {
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
                    await apiRequest<any>(`/vendor-orders/${details.id}/line-items`, {
                        method: "POST",
                        body: JSON.stringify(linePayload),
                    });
                } else {
                    // Update existing row
                    const updatePayload = {
                        item_name: row.item_name,
                        quantity: Number(row.quantity),
                        unit_price: Number(row.unit_price),
                        status: row.status,
                        delivery_progress: Number(row.delivery_progress),
                        vendor_id: row.vendor_id
                    };
                    await apiRequest<any>(`/vendor-orders/line-items/${row.id}`, {
                        method: "PUT",
                        body: JSON.stringify(updatePayload),
                    });
                }
            }
            toast({ title: "Success", description: "All line items synchronized" });
            fetchDetails(true);
            onSuccess?.();
        } catch (error) {
            console.error("Save items error:", error);
            toast({ title: "Error", description: "Failed to sync line items", variant: "destructive" });
        } finally {
            setIsSavingItems(false);
        }
    };

    const handleDeleteLineItem = async (rowIdx: number) => {
        const row = orderRows[rowIdx];
        if (!row.id) {
            const updated = [...orderRows];
            updated.splice(rowIdx, 1);
            setOrderRows(updated);
            return;
        }

        if (!confirm("Delete this item permanently?")) return;
        try {
            await poService.deleteVendorOrderLineItem(row.id);
            toast({ title: "Success", description: "Item removed from bundle" });
            fetchDetails(true);
            onSuccess?.();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
        }
    };

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
    
    const handleUpdateStatus = async (statusType: 'work' | 'payment' | 'vendor', value: string | number) => {
        if (!details) return;
        try {
            const payload: any = {};
            if (statusType === 'work') payload.work_status = value;
            if (statusType === 'payment') payload.payment_status = value;
            if (statusType === 'vendor') payload.vendor_id = value;

            await poService.updateVendorOrder(details.project_id!, details.id, payload);
            toast({ title: "Updated", description: "Bundle status synchronized" });
            fetchDetails(true);
            setIsEditingVendor(false);
            onSuccess?.();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update bundle", variant: "destructive" });
        }
    };

    const handleRecordPayment = async () => {
        if (!details) return;
        try {
            await vendorService.addVendorOrderPayment(details.id, paymentForm);
            toast({ title: "Success", description: "Payment recorded and reconciled" });
            setIsAddPaymentOpen(false);
            setPaymentForm({
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                method: 'bank_transfer',
                reference: ''
            });
            fetchDetails(true);
            onSuccess?.();
        } catch (error) {
            toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
        }
    };

    if (!details && !isLoading) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-[1400px] w-[95vw] h-[95vh] p-0 overflow-hidden border-none rounded-[3rem] bg-[#f8fafc] dark:bg-[#020617] shadow-2xl">
                {isLoading && !details ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-xl">
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400">Synchronizing Global Ledger...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <header className="px-10 py-10 border-b bg-white dark:bg-slate-900 flex flex-col gap-8 sticky top-0 z-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 relative group">
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl" />
                                        <Package className="h-10 w-10 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <DialogTitle className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                                                {details?.po_number || 'DET-BUND-001'}
                                            </DialogTitle>
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 h-6 text-[10px] font-black uppercase tracking-widest">
                                                Live Ledger
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{details?.category || 'General'} Procurement</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Project #{details?.project_id}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commitment Magnitude</p>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                        {formatCurrency(details?.po_value || 0)}
                                    </div>
                                </div>
                            </div>

                            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl h-14 w-fit border border-slate-200 dark:border-slate-700">
                                <TabsTrigger value="overview" className="rounded-xl px-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all h-full">
                                    Strategic Analysis
                                </TabsTrigger>
                                <TabsTrigger value="line-items" className="rounded-xl px-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all h-full">
                                    Sequence Items
                                </TabsTrigger>
                                <TabsTrigger value="payments" className="rounded-xl px-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all h-full">
                                    Commercial Ledger
                                </TabsTrigger>
                            </TabsList>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#f8fafc] dark:bg-slate-950">
                            <TabsContent value="overview" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden group">
                                        <CardHeader className="pb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Truck className="h-3 w-3" /> Supply Status
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <Select value={details?.work_status || 'pending'} onValueChange={(v) => handleUpdateStatus('work', v)}>
                                                <SelectTrigger className="h-12 rounded-xl font-black italic uppercase text-indigo-600 bg-indigo-50/50 border-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-indigo-100 italic">
                                                    <SelectItem value="pending">Pending Sequence</SelectItem>
                                                    <SelectItem value="in_progress">Active Logistics</SelectItem>
                                                    <SelectItem value="completed">Concluded</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <DollarSign className="h-3 w-3" /> Reconcile Status
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <Select value={details?.payment_status || 'pending'} onValueChange={(v) => handleUpdateStatus('payment', v)}>
                                                <SelectTrigger className="h-12 rounded-xl font-black italic uppercase text-emerald-600 bg-emerald-50/50 border-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-emerald-100 italic">
                                                    <SelectItem value="pending">Pending Funds</SelectItem>
                                                    <SelectItem value="partial">Partial Liquidity</SelectItem>
                                                    <SelectItem value="paid">Fully Reconciled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                                        <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Exhaustion</p>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                                    {formatCurrency(paymentSummary?.total_paid || 0)}
                                                </div>
                                                <Badge className="bg-rose-500 text-white border-none rounded-lg h-5 px-2 text-[8px] font-black">
                                                    -{Math.round(((paymentSummary?.total_paid || 0) / (details?.po_value || 1)) * 100)}%
                                                </Badge>
                                            </div>
                                            <p className="text-[9px] text-rose-500/60 font-bold uppercase mt-1">Balance Due</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-indigo-500/5 overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                <TrendingUp className="h-3 w-3" /> Profit Projections
                                            </p>
                                        </CardHeader>
                                        <CardContent className="flex items-center justify-between">
                                            <div>
                                                <div className="text-2xl font-black text-indigo-600 tracking-tight italic">
                                                    {profitAnalysis ? formatCurrency(profitAnalysis.profit) : '-'}
                                                </div>
                                                <p className="text-[9px] text-indigo-500/60 font-bold uppercase mt-1">NET COMMERCIAL GAIN</p>
                                            </div>
                                            {profitAnalysis && (
                                                <div className="text-right">
                                                    <Badge className="bg-indigo-600 text-white border-none rounded-lg h-8 px-4 font-black">
                                                        {profitAnalysis.profit_margin}% MARGIN
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-100 dark:bg-slate-900/50 overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Truck className="h-3 w-3" /> Logistics Velocity
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">
                                                    {Math.round(lineItems.reduce((acc, item) => acc + (item.delivery_progress || 0), 0) / (lineItems.length || 1))}%
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">Aggregate Supply</div>
                                            </div>
                                            <Progress value={lineItems.reduce((acc, item) => acc + (item.delivery_progress || 0), 0) / (lineItems.length || 1)} className="h-2 bg-slate-200" />
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <FileText className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Scope Commentary</h3>
                                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[160px]">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-loose font-medium italic">
                                                    {details?.description || "No specific scope of work documented for this procurement cycle."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Entity Profile</h3>
                                            <div className="bg-indigo-900 dark:bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-900/20">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 opacity-60">Designated Vendor</p>
                                                <h4 className="text-lg font-black mt-2 tracking-tight italic">{details?.vendor_name || 'N/A'}</h4>
                                                <Separator className="my-6 opacity-10" />
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center"><LayoutGrid className="h-4 w-4 text-indigo-300" /></div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/40 leading-none">Category</p>
                                                            <p className="text-[11px] font-bold mt-1 text-white/80">{details?.category || '--'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="line-items" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                            <Zap className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-sm tracking-tight uppercase">Order Sequence Orchestra</h3>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{orderRows.length} units detected in this procurement cycle</p>
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
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                Import Specs
                                            </Button>
                                        )}
                                        <Button 
                                            size="sm" 
                                            disabled={isSavingItems}
                                            onClick={handleSaveItems}
                                            className="h-10 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all gap-2"
                                        >
                                            {isSavingItems ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            Sync Snapshot
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-2">
                                    <EditableGrid 
                                        columns={PROCUREMENT_COLUMNS}
                                        rows={orderRows}
                                        onRowsChange={setOrderRows}
                                        minHeight="500px"
                                        title="Sequence Ledger"
                                        recommendations={mappedRecommendations}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                 <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-sm tracking-tight uppercase">Commercial Ledger</h3>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Fund allocation tracking for this bundle</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setIsAddPaymentOpen(!isAddPaymentOpen)}
                                        className={cn(
                                            "h-10 px-6 rounded-xl border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            isAddPaymentOpen && "bg-emerald-600 text-white border-emerald-600"
                                        )}
                                    >
                                        {isAddPaymentOpen ? "Cancel Entry" : "Record Payment Node"}
                                    </Button>
                                </div>
                                
                                {isAddPaymentOpen && (
                                    <div className="bg-emerald-900/5 dark:bg-emerald-500/5 p-10 rounded-[2.5rem] border border-emerald-500/10 space-y-8 animate-in slide-in-from-top-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Payment Magnitude (₹)</Label>
                                                <Input 
                                                    type="number"
                                                    value={paymentForm.amount}
                                                    onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                                                    className="h-12 rounded-xl bg-white border-slate-200 font-black"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Reference / ID</Label>
                                                <Input 
                                                    placeholder="e.g. TXN-123456"
                                                    value={paymentForm.reference}
                                                    onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                                                    className="h-12 rounded-xl bg-white border-slate-200 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Date of Transfer</Label>
                                                <Input 
                                                    type="date"
                                                    value={paymentForm.date}
                                                    onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                                                    className="h-12 rounded-xl bg-white border-slate-200 font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <Button className="h-12 px-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 text-white" onClick={handleRecordPayment}>Reconcile Payment</Button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {payments.map((p: any) => (
                                        <Card key={p.id} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all">
                                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900 border-b p-6">
                                                <div className="flex justify-between items-center">
                                                    <Badge className="bg-emerald-500 text-white rounded-lg px-2 text-[9px] font-black">PAYMENT NODE #{p.id}</Badge>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.payment_date || p.date || '--'}</span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-8 flex items-center justify-between">
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{formatCurrency(p.amount)}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Liquid Transfer Magnitude</p>
                                                </div>
                                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {payments.length === 0 && (
                                        <div className="md:col-span-2 py-20 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                            <CreditCard className="h-12 w-12 text-slate-200 mb-4 opacity-40" />
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Financial Registry Empty</h3>
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">No payments have been reconciled with this bundle.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
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
                                                    client_line_item_id: item.id
                                                }));
                                                setOrderRows(prev => [...prev.filter(r => r.item_name), ...newRows]);
                                                toast({ title: "Items Added", description: `${itemsToAdd.length} items merged.` });
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
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

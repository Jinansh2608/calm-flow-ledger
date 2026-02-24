import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorOrder, Vendor, PurchaseOrder } from "@/types";
import { vendorService } from "@/services/vendorService";
import { poService } from "@/services/poService";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

interface VendorOrderDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: number;
    purchaseOrder?: PurchaseOrder | null;
    existingOrder?: VendorOrder | null;
    onSuccess: () => void;
}

export function VendorOrderDialog({ open, onClose, projectId: initialProjectId, purchaseOrder, existingOrder, onSuccess }: VendorOrderDialogProps) {
    const { projects } = useDashboard();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number>(initialProjectId);
    const [formData, setFormData] = useState<Partial<VendorOrder>>({
        po_number: '',
        amount: 0,
        description: '',
        status: 'pending',
    });
    
    const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [vendorName, setVendorName] = useState<string>('');
    const [vendors, setVendors] = useState<Vendor[]>([]);

    // sync local project ID with prop
    useEffect(() => {
        if (open) {
            setSelectedProjectId(initialProjectId);
        }
    }, [initialProjectId, open]);

    useEffect(() => {
        const loadVendors = async () => {
             try {
                const response = await vendorService.getAllVendors({ limit: 100 });
                let vendorList: Vendor[] = [];
                if (response && Array.isArray(response.data)) {
                    vendorList = response.data;
                } else if (response && Array.isArray(response)) {
                    vendorList = response;
                } else if (response && Array.isArray((response as any).vendors)) {
                    vendorList = (response as any).vendors;
                }
                setVendors(vendorList);
            } catch (error) {
                console.error("Failed to load vendors", error);
            }
        };
        if (open) loadVendors();
    }, [open]);

    useEffect(() => {
        if (existingOrder) {
            setFormData(existingOrder);
            setPoDate(existingOrder.created_at ? existingOrder.created_at.split('T')[0] : ''); 
            
            if (existingOrder.vendor_name) {
                setVendorName(existingOrder.vendor_name);
            } else if (vendors.length > 0 && existingOrder.vendor_id) {
                 const v = vendors.find(v => v.id === existingOrder.vendor_id);
                 if (v) setVendorName(v.name);
            }

            if (existingOrder.due_date) setDueDate(existingOrder.due_date.split('T')[0]);
        } else {
            // New Order - Pre-fill from PurchaseOrder if available
            setFormData({
                po_number: '',
                amount: 0,
                description: purchaseOrder ? `Order for PO ${purchaseOrder.po_number || 'N/A'}` : '',
                status: 'pending'
            });
            setPoDate(new Date().toISOString().split('T')[0]);
            
            // Try to pre-fill vendor name from PO if it looks like a vendor name
            if (purchaseOrder?.vendor_name) {
                setVendorName(purchaseOrder.vendor_name);
            } else {
                setVendorName('');
            }
            
            setDueDate('');
        }
    }, [existingOrder, open, vendors, purchaseOrder]);

    const handleSubmit = async () => {
        if (!vendorName.trim()) {
            toast({ title: "Error", description: "Please enter a vendor name", variant: "destructive" });
            return;
        }

        // Final check for Project ID
        const finalProjectId = selectedProjectId || initialProjectId;
        if (!finalProjectId || finalProjectId <= 0) {
            const poNum = purchaseOrder?.po_number || "Unknown PO";
            console.error(`Critical: Project ID is ${finalProjectId} for PO: ${poNum}`, {
                purchaseOrder,
                projectId: finalProjectId
            });
            toast({ 
                title: "Project ID Missing", 
                description: `This PO (${poNum}) is not linked to a valid project. Please select a project first.`, 
                variant: "destructive" 
            });
            return;
        }

        const amount = Number(formData.amount) || 0;
        if (amount <= 0) {
            toast({ title: "Error", description: "Please enter a valid amount greater than 0", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            let finalVendorId = existingOrder?.vendor_id;
            
            const existingVendor = vendors.find(v => v.name.toLowerCase() === vendorName.trim().toLowerCase());
            
            if (existingVendor) {
                finalVendorId = existingVendor.id;
            } else {
                try {
                   const newVendor: any = await vendorService.createVendor({ 
                       name: vendorName.trim(), 
                       status: 'ACTIVE' 
                   });

                   if (newVendor && newVendor.id) {
                        finalVendorId = newVendor.id;
                   } else if (typeof newVendor === 'object' && 'data' in newVendor && newVendor.data.id) {
                        finalVendorId = newVendor.data.id;
                   } else {
                        throw new Error("Invalid vendor creation response");
                   }

                   toast({ title: "Info", description: "New vendor created automatically" });
                } catch (createError) {
                   console.error("Failed to create vendor", createError);
                   toast({ title: "Error", description: "Failed to create new vendor. Please try again.", variant: "destructive" });
                   setIsLoading(false);
                   return;
                }
            }

            if (!finalVendorId) {
                throw new Error("Could not determine vendor ID");
            }

            const payload: any = {
                vendor_id: finalVendorId,
                po_number: formData.po_number?.trim() || `VO-${Date.now()}`,
                amount: amount,
                description: formData.description || '',
                status: formData.status || 'pending',
                po_date: poDate || new Date().toISOString().split('T')[0],
                due_date: dueDate || null
            };

            if (existingOrder) {
                await vendorService.updateVendorOrder(finalProjectId, existingOrder.id, payload);
                toast({ title: "Success", description: "Vendor order updated" });
            } else {
                // If the PO itself is not linked to this project yet, link it now
                // This ensures the DetailDrawer and Dashboard correctly associate this PO with the project
                if (purchaseOrder && (!purchaseOrder.project_id || purchaseOrder.project_id === 0)) {
                    try {
                        console.log(`Linking PO ${purchaseOrder.id} to project ${finalProjectId}`);
                        await poService.attachPOToProject(finalProjectId, purchaseOrder.id);
                    } catch (linkError) {
                        console.warn("Failed to auto-link PO to project:", linkError);
                        // Continue anyway as the vendor order creation might still work
                    }
                }

                await vendorService.createVendorOrder(finalProjectId, payload);
                toast({ title: "Success", description: "Vendor order created" });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Vendor Order Error:", error);
            const errorMsg = error?.response?.data?.message || error?.message || "Failed to save vendor order";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{existingOrder ? 'Edit Vendor Order' : 'Create Vendor Order'}</DialogTitle>
                    <DialogDescription>
                        {existingOrder ? 'Update the vendor order details' : 'Create a new vendor order for this project'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    {/* Project Selector (Only if missing or unlinked) */}
                    {(initialProjectId === 0 || !initialProjectId) && (
                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                <AlertCircle className="h-3 w-3" />
                                Project Required
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                This PO is not linked to any project. Select a project to associate this vendor order with.
                            </p>
                            <Select 
                                value={selectedProjectId?.toString()} 
                                onValueChange={(val) => setSelectedProjectId(Number(val))}
                            >
                                <SelectTrigger className="w-full bg-background border-primary/20 h-10 text-xs font-bold">
                                    <SelectValue placeholder="Select a Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Debug Info in Dev */}
                    {process.env.NODE_ENV === 'development' && initialProjectId === 0 && !selectedProjectId && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
                            Warning: Project ID is 0. Saving will fail unless you select a project above.
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="vendor_name" className="text-right">Vendor Name</Label>
                        <div className="col-span-3">
                            <Input 
                                id="vendor_name"
                                list="vendors-list"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                placeholder="Type vendor name..."
                            />
                            <datalist id="vendors-list">
                                {vendors.map(v => (
                                    <option key={v.id} value={v.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="po_number" className="text-right">Vendor PO #</Label>
                        <Input 
                            id="po_number"
                            value={formData.po_number}
                            onChange={(e) => setFormData({...formData, po_number: e.target.value})}
                            placeholder="Vendor PO number"
                            className="col-span-3"
                        />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="po_date" className="text-right">PO Date</Label>
                        <Input 
                            id="po_date"
                            type="date"
                            value={poDate}
                            onChange={(e) => setPoDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="due_date" className="text-right">Due Date</Label>
                        <Input 
                            id="due_date"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount</Label>
                        <Input 
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select 
                            value={formData.status} 
                            onValueChange={(val) => setFormData({...formData, status: val})}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea 
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

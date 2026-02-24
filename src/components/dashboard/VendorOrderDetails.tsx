import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorOrder } from "@/types";
import { poService } from "@/services/poService";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VendorOrderDetailsProps {
    open: boolean;
    onClose: () => void;
    vendorOrder: VendorOrder | null;
}

export function VendorOrderDetails({ open, onClose, vendorOrder }: VendorOrderDetailsProps) {
    const [details, setDetails] = useState<VendorOrder | null>(vendorOrder);
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]); // Linked payments
    const [profitAnalysis, setProfitAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Line Item Form State
    const [isAddLineItemOpen, setIsAddLineItemOpen] = useState(false);
    const [lineItemForm, setLineItemForm] = useState({ item_name: '', quantity: 1, unit_price: 0 });

    // Link Payment Form State
    const [isLinkPaymentOpen, setIsLinkPaymentOpen] = useState(false);
    const [linkPaymentForm, setLinkPaymentForm] = useState({ amount: 0, payment_id: '' });

    const fetchDetails = useCallback(async () => {
        if (!vendorOrder) return;
        setIsLoading(true);
        try {
            // Initialize with vendorOrder data as fallback
            setDetails(vendorOrder);
            
            // Parallel fetch - with error handling for each request
            const results = await Promise.allSettled([
                poService.getVendorOrder(vendorOrder.id),
                poService.getVendorOrderLineItems(vendorOrder.id),
                poService.getVendorOrderPaymentSummary(vendorOrder.id),
                poService.getVendorOrderProfitAnalysis(vendorOrder.id)
            ]);
            
            const orderData = results[0].status === 'fulfilled' ? results[0].value : null;
            const itemsData = results[1].status === 'fulfilled' ? results[1].value : [];
            const paymentsData = results[2].status === 'fulfilled' ? results[2].value : { payments: [] };
            const profitData = results[3].status === 'fulfilled' ? results[3].value : null;

            setDetails(orderData || vendorOrder);
            setLineItems(itemsData || []);
            setPayments(paymentsData?.payments || []);
            setProfitAnalysis(profitData);

        } catch (error) {
            console.error("Error fetching VO details:", error);
            // Still set details from vendorOrder prop as fallback
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

    const handleAddLineItem = async () => {
        if (!details) return;
        try {
            await poService.addVendorOrderLineItem(details.id, lineItemForm);
            toast({ title: "Success", description: "Line item added" });
            setIsAddLineItemOpen(false);
            setLineItemForm({ item_name: '', quantity: 1, unit_price: 0 });
            fetchDetails();
        } catch (error) {
            toast({ title: "Error", description: "Failed to add line item", variant: "destructive" });
        }
    };

    const handleDeleteLineItem = async (itemId: number) => {
        if (!confirm("Delete this line item?")) return;
        try {
            await poService.deleteVendorOrderLineItem(itemId);
            toast({ title: "Success", description: "Line item deleted" });
            fetchDetails();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete line item", variant: "destructive" });
        }
    };

    const handleLinkPayment = async () => {
        if (!details) return;
        try {
            await poService.linkVendorOrderPayment(details.id, {
                link_type: 'outgoing', // Assuming vendor payment is outgoing
                amount: Number(linkPaymentForm.amount),
                payment_id: linkPaymentForm.payment_id
            });
            toast({ title: "Success", description: "Payment linked" });
            setIsLinkPaymentOpen(false);
            setLinkPaymentForm({ amount: 0, payment_id: '' });
            fetchDetails();
        } catch (error) {
            toast({ title: "Error", description: "Failed to link payment", variant: "destructive" });
        }
    };
    
    const handleUpdateStatus = async (statusType: 'work' | 'payment', value: string) => {
        if (!details) return;
        try {
            const payload = statusType === 'work' ? { work_status: value } : { payment_status: value };
            const result = await poService.updateVendorOrderStatus(details.id, payload);
            if (result) {
                setDetails(result);
            }
            toast({ title: "Success", description: "Status updated" });
            fetchDetails();
        } catch (error) {
            console.error("Status update error:", error);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };


    if (!vendorOrder) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl">{details?.po_number || vendorOrder.po_number}</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                {details?.vendor_name || 'Unknown Vendor'} - Vendor Order Details
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                             {/* Status Badges */}
                             <Select 
                                value={details?.work_status || 'pending'} 
                                onValueChange={(val) => handleUpdateStatus('work', val)}
                             >
                                <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue placeholder="Work Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading && !details ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 border-b shrink-0">
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="line-items">Line Items</TabsTrigger>
                                <TabsTrigger value="payments">Payments</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">PO Amount</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{formatCurrency(details?.amount || 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-foreground">{details?.due_date || '-'}</div>
                                        </CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Analysis</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-green-600">
                                                {profitAnalysis ? formatCurrency(profitAnalysis.profit) : '-'}
                                            </div>
                                            {profitAnalysis && (
                                                <p className="text-xs text-muted-foreground mt-1">Margin: {profitAnalysis.profit_margin}%</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {details?.description || "No description provided."}
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="line-items" className="mt-0 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">Line Items</h3>
                                    <Button size="sm" onClick={() => setIsAddLineItemOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Item
                                    </Button>
                                </div>
                                <div className="border rounded-md bg-background overflow-hidden">
                                     <table className="w-full text-sm">
                                         <thead className="bg-muted">
                                             <tr>
                                                 <th className="px-4 py-3 text-left">Item</th>
                                                 <th className="px-4 py-3 text-right">Qty</th>
                                                 <th className="px-4 py-3 text-right">Price</th>
                                                 <th className="px-4 py-3 text-right">Total</th>
                                                 <th className="px-4 py-3 text-right">Actions</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y">
                                             {lineItems.map(item => (
                                                 <tr key={item.id}>
                                                     <td className="px-4 py-3 font-medium">{item.item_name}</td>
                                                     <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                     <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                                     <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.total_amount)}</td>
                                                     <td className="px-4 py-3 text-right">
                                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteLineItem(item.id)}>
                                                             <Trash2 className="h-4 w-4" />
                                                         </Button>
                                                     </td>
                                                 </tr>
                                             ))}
                                             {lineItems.length === 0 && (
                                                 <tr>
                                                     <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                         No line items added yet.
                                                     </td>
                                                 </tr>
                                             )}
                                         </tbody>
                                     </table>
                                </div>
                                
                                {isAddLineItemOpen && (
                                    <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                                        <h4 className="font-medium text-sm">New Line Item</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input 
                                                placeholder="Item Name" 
                                                value={lineItemForm.item_name}
                                                onChange={(e) => setLineItemForm({...lineItemForm, item_name: e.target.value})}
                                            />
                                            <Input 
                                                type="number" 
                                                placeholder="Qty" 
                                                value={lineItemForm.quantity}
                                                onChange={(e) => setLineItemForm({...lineItemForm, quantity: Number(e.target.value)})}
                                            />
                                            <Input 
                                                type="number" 
                                                placeholder="Unit Price" 
                                                value={lineItemForm.unit_price}
                                                onChange={(e) => setLineItemForm({...lineItemForm, unit_price: Number(e.target.value)})}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddLineItemOpen(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleAddLineItem}>Add Item</Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 space-y-4">
                                 <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">Payments</h3>
                                    <Button size="sm" onClick={() => setIsLinkPaymentOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Link Payment
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {payments.map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center p-3 border rounded-md bg-background">
                                            <div>
                                                <p className="font-medium">Payment #{p.id}</p>
                                                <p className="text-xs text-muted-foreground">{p.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{formatCurrency(p.amount)}</p>
                                                <Badge variant="outline">{p.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {payments.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                                            No payments linked.
                                        </div>
                                    )}
                                </div>

                                {isLinkPaymentOpen && (
                                    <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                                        <h4 className="font-medium text-sm">Link Payment</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label>Payment ID</Label>
                                                <Input 
                                                    placeholder="e.g. PAY-123" 
                                                    value={linkPaymentForm.payment_id}
                                                    onChange={(e) => setLinkPaymentForm({...linkPaymentForm, payment_id: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Amount</Label>
                                                <Input 
                                                    type="number"
                                                    value={linkPaymentForm.amount}
                                                    onChange={(e) => setLinkPaymentForm({...linkPaymentForm, amount: Number(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsLinkPaymentOpen(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleLinkPayment}>Link Payment</Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

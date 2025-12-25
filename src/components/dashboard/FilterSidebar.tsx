import { useState } from "react";
import { Filter, RotateCcw, ChevronDown, Building2, FolderKanban, FileText, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const FilterSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className="w-72 border-r bg-sidebar p-4 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Filter className="h-4 w-4 text-primary" />
        </div>
        <span className="font-display font-semibold text-foreground">Filters</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Client & Project</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <Select>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="acme">Acme Corporation</SelectItem>
                  <SelectItem value="globex">Globex Industries</SelectItem>
                  <SelectItem value="initech">Initech Solutions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project / Store</Label>
              <Select>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="retail-expansion">Retail Expansion</SelectItem>
                  <SelectItem value="warehouse-setup">Warehouse Setup</SelectItem>
                  <SelectItem value="office-renovation">Office Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>PO Details</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">PI Number</Label>
              <Input placeholder="e.g., PI-2024-001" className="h-9" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client PO Number</Label>
              <Input placeholder="e.g., CPO-2024-001" className="h-9" />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Vendor</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor</Label>
              <Select>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  <SelectItem value="vendor-a">Alpha Supplies</SelectItem>
                  <SelectItem value="vendor-b">Beta Materials</SelectItem>
                  <SelectItem value="vendor-c">Gamma Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor PO Number</Label>
              <Input placeholder="e.g., VPO-2024-001" className="h-9" />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span>Status</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Order Status</Label>
              <Select>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Date Range</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input type="date" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input type="date" className="h-9" />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="pt-4 mt-4 border-t space-y-2">
        <Button className="w-full" size="sm">
          Apply Filters
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>
    </aside>
  );
};

export default FilterSidebar;

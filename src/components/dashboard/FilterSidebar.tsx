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
import { useDashboard, clients, projects, vendors, statuses } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

const FilterSidebar = () => {
  const { filters, setFilters, applyFilters, resetFilters, isFiltered } = useDashboard();

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <aside className="w-72 border-r bg-sidebar p-4 flex flex-col h-screen sticky top-0">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-semibold text-foreground">Filters</span>
        </div>
        {isFiltered && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            Active
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Client & Project</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <Select value={filters.client} onValueChange={(v) => updateFilter("client", v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project / Store</Label>
              <Select value={filters.project} onValueChange={(v) => updateFilter("project", v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>PO Details</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">PI Number</Label>
              <Input 
                placeholder="e.g., PI-2024-001" 
                className="h-9" 
                value={filters.piNumber}
                onChange={(e) => updateFilter("piNumber", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client PO Number</Label>
              <Input 
                placeholder="e.g., CPO-2024-001" 
                className="h-9"
                value={filters.clientPONumber}
                onChange={(e) => updateFilter("clientPONumber", e.target.value)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Vendor</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor</Label>
              <Select value={filters.vendor} onValueChange={(v) => updateFilter("vendor", v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor PO Number</Label>
              <Input 
                placeholder="e.g., VPO-2024-001" 
                className="h-9"
                value={filters.vendorPONumber}
                onChange={(e) => updateFilter("vendorPONumber", e.target.value)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span>Status</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Order Status</Label>
              <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Date Range</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input 
                type="date" 
                className="h-9"
                value={filters.fromDate}
                onChange={(e) => updateFilter("fromDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input 
                type="date" 
                className="h-9"
                value={filters.toDate}
                onChange={(e) => updateFilter("toDate", e.target.value)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="pt-4 mt-4 border-t space-y-2">
        <Button className="w-full" size="sm" onClick={applyFilters}>
          Apply Filters
        </Button>
        <Button 
          variant="ghost" 
          className={cn("w-full", isFiltered ? "text-destructive hover:text-destructive" : "text-muted-foreground")} 
          size="sm"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>
    </aside>
  );
};

export default FilterSidebar;

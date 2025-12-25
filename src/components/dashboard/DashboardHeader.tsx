import { Bell, Search, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DashboardHeader = () => {
  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">PX</span>
          </div>
          <span className="font-display font-semibold text-lg text-foreground">ProXecute</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 ml-8">
          <Button variant="ghost" size="sm" className="text-foreground">Dashboard</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">Projects</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">Clients</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">Vendors</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">Reports</Button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, clients..."
            className="w-64 pl-9 h-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

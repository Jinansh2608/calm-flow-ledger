import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import NewOrderDialog from "./NewOrderDialog";
import { EndpointSettings } from "./EndpointSettings";
import { useAuth } from "@/contexts/AuthContext";

const DashboardHeader = () => {
  const { logout, user } = useAuth();
  
  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">PX</span>
          </div>
          <span className="font-display font-semibold text-lg text-foreground">ProXecute</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, clients..."
            className="w-64 pl-9 h-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background"
          />
        </div>

        <NewOrderDialog />

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        <EndpointSettings />

        <div className="flex items-center gap-2 h-8 px-3 rounded-full bg-primary/10 border border-primary/20">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary hidden md:inline-block">
            {user?.username || "User"}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;

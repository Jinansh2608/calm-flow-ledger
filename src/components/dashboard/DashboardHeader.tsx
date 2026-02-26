import { Search, User, LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import NewOrderDialog from "./NewOrderDialog";


import AdvancedExportModal from "./AdvancedExportModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
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

        {/* Create Quotation - Primary Action */}
        <Button
          onClick={() => navigate("/quotation/create")}
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-violet-600/30"
        >
          <FileText className="h-3.5 w-3.5" />
          + Create Quotation
        </Button>

        <NewOrderDialog />



        {/* Advanced Export */}
        <AdvancedExportModal />

        <ThemeToggle />



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

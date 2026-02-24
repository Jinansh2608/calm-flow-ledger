import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export const EndpointSettings = () => {
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState("");

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem('API_BASE_URL_OVERRIDE');
      setEndpoint(stored || import.meta.env.VITE_API_BASE_URL || '/api');
    }
  }, [open]);

  const handleSave = () => {
    if (endpoint.trim()) {
      localStorage.setItem('API_BASE_URL_OVERRIDE', endpoint.trim());
    } else {
      localStorage.removeItem('API_BASE_URL_OVERRIDE');
    }
    setOpen(false);
    // Reload the page to ensure the new endpoint is used everywhere
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="API Settings">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Endpoint Configuration</DialogTitle>
          <DialogDescription>
            Override the default backend API endpoint URL. This is useful for switching between local and production environments dynamically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="endpoint-url">Backend URL</Label>
            <Input
              id="endpoint-url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="e.g. /api or https://api.production.com"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Save & Reload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

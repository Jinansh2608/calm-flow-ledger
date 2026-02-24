import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_CONFIG } from "@/config/api";
import { AuthService } from "@/services/api";

const Auth = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendUrl, setBackendUrl] = useState("");

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      setBackendUrl(API_CONFIG.BASE_URL);
      const isHealthy = await AuthService.checkBackendHealth();
      setBackendStatus(isHealthy ? 'online' : 'offline');
    };
    checkBackend();
  }, []);

  const handleAuth = async (isLogin: boolean) => {
    if (backendStatus === 'offline') {
      toast({ 
        title: "Backend Unavailable", 
        description: `Cannot connect to backend at ${backendUrl}. Please ensure the backend server is running.`, 
        variant: "destructive" 
      });
      return;
    }

    if (!username || !password || (!isLogin && !email)) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        setLoadingMessage("Signing in...");
        await login(username, password);
        toast({ title: "Success", description: "Successfully logged in." });
        navigate("/");
      } else {
        setLoadingMessage("Creating account...");
        await signup(username, email, password);
        setLoadingMessage("Loading dashboard...");
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({ title: "Success", description: "Account created and logged in." });
        navigate("/");
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      
      // Check if it's a network error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        toast({ 
          title: "Network Error", 
          description: `Cannot reach backend at ${backendUrl}. Is it running?`, 
          variant: "destructive" 
        });
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        toast({ 
          title: "Request Timeout", 
          description: `Backend at ${backendUrl} is not responding. Please check if it's running and accessible.`, 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Authentication Failed", 
          description: errorMessage, 
          variant: "destructive" 
        });
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card">
        {/* Backend Status Alert */}
        {backendStatus === 'offline' && (
          <div className="px-6 pt-6 pb-0">
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                <strong>Backend unavailable.</strong> Ensure backend is running at <code className="text-xs bg-destructive/10 px-1.5 py-0.5 rounded">{backendUrl}</code>
              </AlertDescription>
            </Alert>
          </div>
        )}
        {backendStatus === 'online' && (
          <div className="px-6 pt-6 pb-0">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Backend connected at <code className="text-xs bg-green-100 px-1.5 py-0.5 rounded">{backendUrl}</code>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">PX</span>
                  </div>
                 <span className="font-display font-bold text-xl text-foreground">ProXecute</span>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>
              Login or create an account to securely access the ledger and analytics dashboards.
            </CardDescription>

            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="login" disabled={isLoading}>Login</TabsTrigger>
              <TabsTrigger value="signup" disabled={isLoading}>Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-user">Username</Label>
                <Input
                  id="login-user"
                  type="text"
                  placeholder="john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || backendStatus === 'offline'}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-pass">Password</Label>
                </div>
                <Input
                  id="login-pass"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || backendStatus === 'offline'}
                />
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => handleAuth(true)} 
                disabled={isLoading || backendStatus === 'offline'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage || "Signing in..."}
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-user">Username</Label>
                <Input
                  id="signup-user"
                  type="text"
                  placeholder="john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || backendStatus === 'offline'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || backendStatus === 'offline'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-pass">Password</Label>
                <Input
                  id="signup-pass"
                  type="password"
                  placeholder="SecurePass123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || backendStatus === 'offline'}
                />
              </div>
              {isLoading && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingMessage}
                  </div>
                </div>
              )}
              <Button 
                className="w-full mt-4" 
                onClick={() => handleAuth(false)} 
                disabled={isLoading || backendStatus === 'offline'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage || "Creating account..."}
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;

import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import WalletSetup from "@/components/WalletSetup";
import Dashboard from "@/components/Dashboard";
import TransactionReceipt from "@/pages/TransactionReceipt";
import NotFound from "@/pages/not-found";
import { hasStoredWallet } from "@/lib/wallet";

function Router() {
  const [, setLocation] = useLocation();
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    const walletExists = hasStoredWallet();
    setHasWallet(walletExists);

    if (walletExists && window.location.pathname === "/") {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  if (hasWallet === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text mb-2">Mintrax Wallet</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={WalletSetup} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/receipt/:txHash" component={TransactionReceipt} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

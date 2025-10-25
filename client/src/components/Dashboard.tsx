import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, Wallet, ExternalLink, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadCustomTokens, getStoredAddress, type StoredToken } from "@/lib/wallet";
import { getAllTokenBalances, truncateAddress } from "@/lib/web3";
import type { TokenBalance } from "@/lib/web3";
import { getNetworkConfig } from "@/lib/network";
import { useWebSocket } from "@/lib/websocket";
import QRCode from "react-qr-code";
import { useLocation } from "wouter";
import AddTokenDialog from "./AddTokenDialog";
import SendDialog from "./SendDialog";
import ReceiveDialog from "./ReceiveDialog";
import TransactionHistory from "./TransactionHistory";
import { BackupDialog } from "./BackupDialog";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [customTokens, setCustomTokens] = useState<StoredToken[]>([]);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const networkConfig = getNetworkConfig();

  useEffect(() => {
    const address = getStoredAddress();
    if (!address) {
      setLocation("/");
      return;
    }
    setWalletAddress(address);
    setCustomTokens(loadCustomTokens());
  }, [setLocation]);

  const { data: balances, isLoading, refetch } = useQuery<TokenBalance[]>({
    queryKey: ["/api/balances", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return getAllTokenBalances(walletAddress, customTokens);
    },
    enabled: !!walletAddress,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // WebSocket connection for live updates
  useWebSocket((message) => {
    if (message.type === "newBlock") {
      console.log("New block detected, refreshing balances");
      refetch();
    } else if (message.type === "transactionUpdate") {
      console.log("Transaction update received:", message.transaction);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", walletAddress] });
      
      if (message.transaction.status === "success" || message.transaction.status === "failed") {
        toast({
          title: `Transaction ${message.transaction.status === "success" ? "Confirmed" : "Failed"}`,
          description: `Transaction ${truncateAddress(message.transaction.txHash)} is now ${message.transaction.status}`,
        });
        refetch();
      }
    } else if (message.type === "newTransaction") {
      console.log("New transaction detected");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", walletAddress] });
    }
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleTokenAdded = () => {
    setCustomTokens(loadCustomTokens());
    refetch();
  };

  const nativeBalance = balances?.find(b => b.contractAddress === null);
  const tokenBalances = balances?.filter(b => b.contractAddress !== null) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
      <div className="border-b glass-effect sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <img src="/images/MTT.png" alt={networkConfig.nativeToken} className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mintrax Wallet</h1>
                <Badge variant="outline" className="text-xs">
                  {networkConfig.name}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 glass-effect px-3 py-2 rounded-md">
                <span className="text-sm font-mono">{truncateAddress(walletAddress)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress} data-testid="button-copy-address-header">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                data-testid="button-refresh-balances"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="glass-effect overflow-hidden">
              <div className="gradient-bg absolute inset-0 opacity-30"></div>
              <CardHeader className="relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {isLoading ? (
                  <Skeleton className="h-16 w-48" />
                ) : (
                  <div className="space-y-2">
                    <div className="text-5xl font-bold" data-testid="text-native-balance">
                      {parseFloat(nativeBalance?.balance || "0").toFixed(4)}
                    </div>
                    <div className="text-xl text-muted-foreground">{networkConfig.nativeToken}</div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowSend(true)}
                    className="flex-1"
                    size="lg"
                    data-testid="button-send"
                  >
                    <ArrowUpRight className="w-5 h-5 mr-2" />
                    Send
                  </Button>
                  <Button
                    onClick={() => setShowReceive(true)}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                    data-testid="button-receive"
                  >
                    <ArrowDownLeft className="w-5 h-5 mr-2" />
                    Receive
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tokens */}
            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tokens</CardTitle>
                <Button
                  onClick={() => setShowAddToken(true)}
                  size="sm"
                  variant="outline"
                  data-testid="button-add-token"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Token
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Native Token */}
                <div className="flex items-center justify-between p-4 rounded-md hover-elevate glass-effect" data-testid="token-card-native">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary"><img src="/images/MTT.png" /></span>
                    </div>
                    <div>
                      <div className="font-semibold">{networkConfig.nativeToken}</div>
                      <div className="text-sm text-muted-foreground">Native Token</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      <>
                        <div className="font-semibold">{parseFloat(nativeBalance?.balance || "0").toFixed(4)}</div>
                        <div className="text-sm text-muted-foreground">{networkConfig.nativeToken}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Custom Tokens */}
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    ))}
                  </div>
                ) : tokenBalances.length > 0 ? (
                  tokenBalances.map((token) => (
                    <div
                      key={token.contractAddress}
                      className="flex items-center justify-between p-4 rounded-md hover-elevate glass-effect"
                      data-testid={`token-card-${token.symbol}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-chart-3/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-chart-3">{token.symbol[0]}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{token.name}</div>
                          <div className="text-sm text-muted-foreground">{token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{parseFloat(token.balance).toFixed(4)}</div>
                        <div className="text-sm text-muted-foreground">{token.symbol}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="">
                    
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <TransactionHistory walletAddress={walletAddress} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">Wallet Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-md">
                  <QRCode
                    value={walletAddress}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    data-testid="qr-code-address"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono break-all bg-muted/50 p-3 rounded-md" data-testid="text-full-address">
                    {walletAddress}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={copyAddress}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      data-testid="button-copy-address-sidebar"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={() => setShowBackup(true)}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      data-testid="button-backup-wallet"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">Network Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">{networkConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain ID</span>
                  <span className="font-mono">{networkConfig.chainId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Native Token</span>
                  <span className="font-medium">{networkConfig.nativeToken}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => window.open(`${networkConfig.explorer}/address/${walletAddress}`, "_blank")}
                  data-testid="button-view-explorer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Explorer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddTokenDialog open={showAddToken} onClose={() => setShowAddToken(false)} onTokenAdded={handleTokenAdded} />
      <SendDialog
        open={showSend}
        onClose={() => setShowSend(false)}
        walletAddress={walletAddress}
        tokens={balances || []}
      />
      <ReceiveDialog
        open={showReceive}
        onClose={() => setShowReceive(false)}
        walletAddress={walletAddress}
      />
      <BackupDialog
        open={showBackup}
        onOpenChange={setShowBackup}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { truncateAddress } from "@/lib/web3";
import { getNetworkConfig } from "@/lib/network";
import { format } from "date-fns";
import TransactionDetailModal from "./TransactionDetailModal";

interface Transaction {
  id: string;
  txHash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  timestamp: Date;
  status: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  type: "send" | "receive";
}

interface TransactionHistoryProps {
  walletAddress: string;
}

export default function TransactionHistory({ walletAddress }: TransactionHistoryProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const networkConfig = getNetworkConfig();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const response = await fetch(`/api/transactions/${walletAddress}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    enabled: !!walletAddress,
  });

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-success text-success-foreground">Success</Badge>;
    }
    if (status === "pending") {
      return <Badge className="bg-pending text-pending-foreground">Pending</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentTransactions = transactions?.slice(0, 10) || [];

  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">No transactions yet</div>
              <div className="text-xs mt-1">Your transaction history will appear here</div>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="w-full flex items-center gap-3 p-4 rounded-md hover-elevate glass-effect text-left"
                data-testid={`transaction-${tx.txHash.substring(0, 10)}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === "send" ? "bg-destructive/20" : "bg-success/20"
                }`}>
                  {tx.type === "send" ? (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{tx.type}</span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {tx.type === "send" ? "To: " : "From: "}
                    {truncateAddress(tx.type === "send" ? tx.to : tx.from)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {tx.type === "send" ? "-" : "+"}{parseFloat(tx.value).toFixed(4)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tx.tokenSymbol || networkConfig.nativeToken}
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </>
  );
}

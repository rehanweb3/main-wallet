import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const { data: transactionData, isLoading } = useQuery<{ sent: Transaction[], received: Transaction[] }>({
    queryKey: ["/api/transactions", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return { sent: [], received: [] };
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

  const sentTransactions = transactionData?.sent?.slice(0, 10) ?? [];
  const receivedTransactions = transactionData?.received?.slice(0, 10) ?? [];

  const renderTransactionList = (transactions: Transaction[], emptyMessage: string) => {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-sm">{emptyMessage}</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {transactions.map((tx) => (
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
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(tx.timestamp), "PPp")}
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
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderTransactionList(
                [...sentTransactions, ...receivedTransactions]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 10),
                "No transactions yet"
              )}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              {renderTransactionList(sentTransactions, "No sent transactions yet")}
            </TabsContent>
            <TabsContent value="received" className="mt-4">
              {renderTransactionList(receivedTransactions, "No received transactions yet")}
            </TabsContent>
          </Tabs>
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

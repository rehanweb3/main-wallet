import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, Copy, XCircle, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getNetworkConfig } from "@/lib/network";
import { format } from "date-fns";

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

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const { toast } = useToast();
  const networkConfig = getNetworkConfig();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "success") {
      return <CheckCircle className="w-10 h-10 text-success" />;
    }
    if (status === "pending") {
      return <Clock className="w-10 h-10 text-pending" />;
    }
    return <XCircle className="w-10 h-10 text-destructive" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-success text-success-foreground">Success</Badge>;
    }
    if (status === "pending") {
      return <Badge className="bg-pending text-pending-foreground">Pending</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  const getStatusTitle = (status: string) => {
    if (status === "success") {
      return "Transaction Successful";
    }
    if (status === "pending") {
      return "Transaction Pending";
    }
    return "Transaction Failed";
  };

  const getStatusDescription = (status: string) => {
    if (status === "success") {
      return "Your transaction has been confirmed";
    }
    if (status === "pending") {
      return "Your transaction is being processed";
    }
    return "Your transaction has failed";
  };

  const gasFee = transaction.gasUsed && transaction.gasPrice
    ? (BigInt(transaction.gasUsed) * BigInt(transaction.gasPrice) / BigInt(10 ** 18)).toString()
    : "N/A";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white overflow-hidden flex flex-col" data-testid="dialog-transaction-detail">
        <DialogHeader className="text-center pb-8 flex-shrink-0">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              transaction.status === "success" ? "bg-success/20" :
              transaction.status === "pending" ? "bg-pending/20" :
              "bg-destructive/20"
            }`}>
              {getStatusIcon(transaction.status)}
            </div>
          </div>
          <DialogTitle className="text-2xl">{getStatusTitle(transaction.status)}</DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">{getStatusDescription(transaction.status)}</div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Watermark */}
          <div className="text-center border-b pb-4">
            <div className="text-lg font-semibold gradient-text">Mintrax Wallet</div>
          </div>

          {/* Transaction Details */}
<div className="bg-white p-6 rounded-md space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-3xl font-bold">
                {parseFloat(transaction.value).toFixed(6)} {transaction.tokenSymbol || networkConfig.nativeToken}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Gas Fee</div>
                <div className="font-semibold">
                  {gasFee !== "N/A" ? `${parseFloat(gasFee).toFixed(6)} ${networkConfig.nativeToken}` : gasFee}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Block Number</div>
                <div className="font-mono" data-testid="text-block-number">
                  {transaction.blockNumber || "Pending"}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Transaction Hash</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1 bg-muted/50 p-2 rounded" data-testid="text-tx-hash">
                  {transaction.txHash}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(transaction.txHash, "Transaction hash")}
                  data-testid="button-copy-tx-hash"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">From Address</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1 bg-muted/50 p-2 rounded" data-testid="text-from-address">
                  {transaction.from}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(transaction.from, "From address")}
                  data-testid="button-copy-from"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">To Address</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1 bg-muted/50 p-2 rounded" data-testid="text-to-address">
                  {transaction.to}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(transaction.to, "To address")}
                  data-testid="button-copy-to"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Timestamp</div>
              <div data-testid="text-timestamp">
                {format(new Date(transaction.timestamp), "PPpp")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Network</div>
                <div className="font-semibold">{networkConfig.name}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Status</div>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(`${networkConfig.explorer}/tx/${transaction.txHash}`, "_blank")}
            data-testid="button-view-in-explorer"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Explorer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy } from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-success text-success-foreground">Success</Badge>;
    }
    if (status === "pending") {
      return <Badge className="bg-pending text-pending-foreground">Pending</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  const gasFee = transaction.gasUsed && transaction.gasPrice
    ? (BigInt(transaction.gasUsed) * BigInt(transaction.gasPrice) / BigInt(10 ** 18)).toString()
    : "N/A";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-effect" data-testid="dialog-transaction-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Transaction Receipt
            {getStatusBadge(transaction.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Watermark */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground opacity-60">Mintrax Wallet</div>
          </div>

          {/* Main Details */}
          <div className="glass-effect p-6 rounded-md space-y-4">
            <div className="grid gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-2xl font-bold">
                  {parseFloat(transaction.value).toFixed(6)} {transaction.tokenSymbol || networkConfig.nativeToken}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Gas Fee</div>
                <div className="font-semibold">
                  {gasFee !== "N/A" ? `${parseFloat(gasFee).toFixed(6)} ${networkConfig.nativeToken}` : gasFee}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1" data-testid="text-tx-hash">
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
                  <code className="text-xs font-mono break-all flex-1" data-testid="text-from-address">
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
                  <code className="text-xs font-mono break-all flex-1" data-testid="text-to-address">
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

              {transaction.blockNumber && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Block Number</div>
                  <div className="font-mono" data-testid="text-block-number">{transaction.blockNumber}</div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Timestamp</div>
                <div data-testid="text-timestamp">
                  {format(new Date(transaction.timestamp), "PPpp")}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Network</div>
                <div className="font-semibold">{networkConfig.name}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Token Type</div>
                <div className="font-semibold">
                  {transaction.tokenAddress ? "ERC20" : "Native"}
                </div>
              </div>
            </div>
          </div>

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

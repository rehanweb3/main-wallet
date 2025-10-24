import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ExternalLink, ArrowLeft, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProvider } from "@/lib/web3";
import { getNetworkConfig } from "@/lib/network";
import { format } from "date-fns";

export default function TransactionReceipt() {
  const [, params] = useRoute("/receipt/:txHash");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const networkConfig = getNetworkConfig();
  const txHash = params?.txHash || "";

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!txHash) return;

      try {
        const provider = getProvider();
        const [txReceipt, tx] = await Promise.all([
          provider.getTransactionReceipt(txHash),
          provider.getTransaction(txHash),
        ]);

        setReceipt(txReceipt);
        setTransaction(tx);
      } catch (error) {
        console.error("Failed to fetch receipt:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [txHash]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
        <Card className="glass-effect max-w-2xl w-full">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <div className="text-lg font-semibold">Loading Transaction Receipt...</div>
            <div className="text-sm text-muted-foreground mt-2">Please wait</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gasFee = receipt?.gasUsed && transaction?.gasPrice
    ? (Number(receipt.gasUsed * transaction.gasPrice) / 10 ** 18).toFixed(6)
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="glass-effect">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>
            <CardTitle className="text-2xl">Transaction Successful</CardTitle>
            <div className="text-sm text-muted-foreground mt-2">Your transaction has been confirmed</div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Watermark */}
            <div className="text-center border-b pb-4">
              <div className="text-lg font-semibold gradient-text">Mintrax Wallet</div>
            </div>

            {/* Transaction Details */}
            <div className="glass-effect p-6 rounded-md space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-3xl font-bold">
                  {transaction ? (parseFloat(transaction.value.toString()) / 10 ** 18).toFixed(6) : "0"} {networkConfig.nativeToken}
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
                  <div className="font-mono" data-testid="text-receipt-block">{receipt?.blockNumber || "Pending"}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1 bg-muted/50 p-2 rounded" data-testid="text-receipt-hash">
                    {txHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(txHash, "Transaction hash")}
                    data-testid="button-copy-receipt-hash"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">From Address</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1 bg-muted/50 p-2 rounded" data-testid="text-receipt-from">
                    {transaction?.from || "N/A"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transaction?.from || "", "From address")}
                    data-testid="button-copy-receipt-from"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">To Address</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1 bg-muted/50 p-2 rounded" data-testid="text-receipt-to">
                    {transaction?.to || "N/A"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transaction?.to || "", "To address")}
                    data-testid="button-copy-receipt-to"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Timestamp</div>
                <div data-testid="text-receipt-timestamp">
                  {format(new Date(), "PPpp")}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Network</div>
                  <div className="font-semibold">{networkConfig.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className="bg-success text-success-foreground">
                    {receipt?.status === 1 ? "Success" : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`${networkConfig.explorer}/tx/${txHash}`, "_blank")}
                data-testid="button-view-explorer-receipt"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Explorer
              </Button>
              <Button
                className="flex-1"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-done-receipt"
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

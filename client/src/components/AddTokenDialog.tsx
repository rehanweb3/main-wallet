import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectTokenMetadata } from "@/lib/web3";
import { addCustomToken } from "@/lib/wallet";
import { isValidAddress } from "@/lib/web3";

interface AddTokenDialogProps {
  open: boolean;
  onClose: () => void;
  onTokenAdded: () => void;
}

export default function AddTokenDialog({ open, onClose, onTokenAdded }: AddTokenDialogProps) {
  const { toast } = useToast();
  const [contractAddress, setContractAddress] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<{ name: string; symbol: string; decimals: number } | null>(null);
  const [error, setError] = useState("");

  const handleDetect = async () => {
    if (!contractAddress.trim()) {
      setError("Please enter a contract address");
      return;
    }

    if (!isValidAddress(contractAddress)) {
      setError("Invalid contract address");
      return;
    }

    setError("");
    setDetecting(true);
    setDetected(null);

    try {
      const metadata = await detectTokenMetadata(contractAddress);
      setDetected(metadata);
    } catch (err: any) {
      setError(err.message || "Failed to detect token metadata");
    } finally {
      setDetecting(false);
    }
  };

  const handleAdd = () => {
    if (!detected) return;

    addCustomToken({
      contractAddress,
      name: detected.name,
      symbol: detected.symbol,
      decimals: detected.decimals,
    });

    toast({
      title: "Token Added",
      description: `${detected.symbol} has been added to your wallet`,
    });

    onTokenAdded();
    handleClose();
  };

  const handleClose = () => {
    setContractAddress("");
    setDetected(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="dialog-add-token">
        <DialogHeader>
          <DialogTitle>Add Custom Token</DialogTitle>
          <DialogDescription>
            Enter the token contract address to automatically detect its details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contractAddress">Token Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="contractAddress"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono"
                data-testid="input-contract-address"
              />
              <Button
                onClick={handleDetect}
                disabled={detecting || !contractAddress}
                data-testid="button-detect-token"
              >
                {detecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Detecting
                  </>
                ) : (
                  "Detect"
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {detected && (
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Name:</div>
                    <div className="font-semibold" data-testid="text-token-name">{detected.name}</div>
                    <div className="text-muted-foreground">Symbol:</div>
                    <div className="font-semibold" data-testid="text-token-symbol">{detected.symbol}</div>
                    <div className="text-muted-foreground">Decimals:</div>
                    <div className="font-semibold" data-testid="text-token-decimals">{detected.decimals}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1" data-testid="button-cancel-add-token">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!detected}
              className="flex-1"
              data-testid="button-confirm-add-token"
            >
              Add Token
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

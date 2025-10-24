import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

interface ReceiveDialogProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
}

export default function ReceiveDialog({ open, onClose, walletAddress }: ReceiveDialogProps) {
  const { toast } = useToast();

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-receive">
        <DialogHeader>
          <DialogTitle>Receive Tokens</DialogTitle>
          <DialogDescription>
            Share your wallet address or QR code to receive tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-md flex justify-center">
            <QRCode
              value={walletAddress}
              size={240}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              data-testid="qr-code-receive"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Your Wallet Address</div>
            <div className="text-xs font-mono break-all bg-muted/50 p-3 rounded-md" data-testid="text-receive-address">
              {walletAddress}
            </div>
          </div>

          <Button onClick={copyAddress} className="w-full" data-testid="button-copy-receive-address">
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

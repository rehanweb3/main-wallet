import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Copy, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { loadWallet } from "@/lib/wallet";
import type { WalletData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
  const [password, setPassword] = useState("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [error, setError] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const { toast } = useToast();

  const handleVerifyPassword = () => {
    try {
      const wallet = loadWallet(password);
      if (wallet) {
        setWalletData(wallet);
        setError("");
      } else {
        setError("Failed to load wallet");
      }
    } catch (err: any) {
      setError(err.message || "Invalid password");
    }
  };

  const handleCopy = async (text: string, type: "mnemonic" | "privateKey") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "mnemonic") {
        setCopiedMnemonic(true);
        setTimeout(() => setCopiedMnemonic(false), 2000);
      } else {
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      }
      toast({
        title: "Copied to clipboard",
        description: `Your ${type === "mnemonic" ? "seed phrase" : "private key"} has been copied.`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!walletData) return;

    const backupData = {
      address: walletData.address,
      ...(walletData.mnemonic && { seedPhrase: walletData.mnemonic }),
      privateKey: walletData.privateKey,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mintrax-wallet-backup-${walletData.address.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup downloaded",
      description: "Your wallet backup has been saved to your device.",
    });
  };

  const handleClose = () => {
    setPassword("");
    setWalletData(null);
    setError("");
    setShowMnemonic(false);
    setShowPrivateKey(false);
    setCopiedMnemonic(false);
    setCopiedPrivateKey(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Backup Wallet</DialogTitle>
          <DialogDescription>
            Securely backup your wallet credentials. Keep them safe and never share them with anyone.
          </DialogDescription>
        </DialogHeader>

        {!walletData ? (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Enter your password to view your wallet backup information.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleVerifyPassword} className="w-full">
              Verify Password
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Never share your seed phrase or private key with anyone. Anyone with access to these can control your wallet.
              </AlertDescription>
            </Alert>

            {walletData.mnemonic && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Seed Phrase (12 words)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                  >
                    {showMnemonic ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    {showMnemonic ? walletData.mnemonic : "••••••••••••••••••••••••••••••••••••"}
                  </div>
                  {showMnemonic && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(walletData.mnemonic!, "mnemonic")}
                    >
                      {copiedMnemonic ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Private Key</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  {showPrivateKey ? walletData.privateKey : "••••••••••••••••••••••••••••••••••••"}
                </div>
                {showPrivateKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(walletData.privateKey, "privateKey")}
                  >
                    {copiedPrivateKey ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

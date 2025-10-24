import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadWallet } from "@/lib/wallet";
import { sendNativeToken, sendToken, estimateNativeGas, estimateTokenGas, isValidAddress } from "@/lib/web3";
import type { TokenBalance } from "@/lib/web3";
import { getNetworkConfig } from "@/lib/network";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SendDialogProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  tokens: TokenBalance[];
}

export default function SendDialog({ open, onClose, walletAddress, tokens }: SendDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const networkConfig = getNetworkConfig();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [gasEstimate, setGasEstimate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  const handleSelectToken = (contractAddress: string | null) => {
    const token = tokens.find(t => t.contractAddress === contractAddress);
    if (token) {
      setSelectedToken(token);
      setStep(2);
    }
  };

  const handleNext = async () => {
    setError("");

    if (step === 2) {
      if (!recipient.trim()) {
        setError("Please enter a recipient address");
        return;
      }
      if (!isValidAddress(recipient)) {
        setError("Invalid recipient address");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!amount || parseFloat(amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }
      if (parseFloat(amount) > parseFloat(selectedToken?.balance || "0")) {
        setError("Insufficient balance");
        return;
      }

      setLoading(true);
      try {
        let estimate;
        if (selectedToken?.contractAddress) {
          estimate = await estimateTokenGas(
            "", // Private key not needed for estimation
            selectedToken.contractAddress,
            recipient,
            amount,
            selectedToken.decimals
          );
        } else {
          estimate = await estimateNativeGas(walletAddress, recipient, amount);
        }
        setGasEstimate(estimate);
        setStep(4);
      } catch (err) {
        setError("Failed to estimate gas. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleConfirm = async () => {
    if (!password) {
      setError("Please enter your wallet password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const wallet = loadWallet(password);
      if (!wallet) {
        throw new Error("Invalid password");
      }

      let tx;
      if (selectedToken?.contractAddress) {
        tx = await sendToken(
          wallet.privateKey,
          selectedToken.contractAddress,
          recipient,
          amount,
          selectedToken.decimals
        );
      } else {
        tx = await sendNativeToken(wallet.privateKey, recipient, amount);
      }

      setTxHash(tx.hash);
      
      // Record transaction in backend
      try {
        await apiRequest("POST", "/api/transactions", {
          walletAddress,
          txHash: tx.hash,
          from: walletAddress,
          to: recipient,
          value: amount,
          timestamp: new Date(),
          status: "pending",
          tokenAddress: selectedToken?.contractAddress || null,
          tokenSymbol: selectedToken?.symbol,
          tokenDecimals: selectedToken?.decimals,
          type: "send",
        });
      } catch (err) {
        console.error("Failed to record transaction:", err);
        // Continue anyway - transaction was sent
      }
      
      toast({
        title: "Transaction Sent",
        description: "Your transaction has been broadcast to the network",
      });

      setTimeout(() => {
        handleClose();
        setLocation(`/receipt/${tx.hash}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedToken(null);
    setRecipient("");
    setAmount("");
    setPassword("");
    setGasEstimate("");
    setError("");
    setTxHash("");
    onClose();
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Token</Label>
            <div className="space-y-2">
              {tokens.map((token) => (
                <button
                  key={token.contractAddress || "native"}
                  onClick={() => handleSelectToken(token.contractAddress)}
                  className="w-full flex items-center justify-between p-4 rounded-md hover-elevate glass-effect text-left"
                  data-testid={`button-select-token-${token.symbol}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                      {token.logoUrl ? (
                        <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
                      ) : token.contractAddress === null ? (
                        // Native token - use image from public/images/<TOKEN>.png (e.g. /images/MTT.png)
                        <img
                          src={`/images/MTT.png`}
                          alt={networkConfig.nativeToken}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold">{token.symbol[0]}</span>
                      )}
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
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <AlertDescription>
              <div className="text-sm">
                <div className="font-medium mb-1">Sending {selectedToken?.symbol}</div>
                <div className="text-muted-foreground">Available: {parseFloat(selectedToken?.balance || "0").toFixed(4)} {selectedToken?.symbol}</div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="font-mono"
              data-testid="input-recipient"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <AlertDescription>
              <div className="text-sm">
                <div className="font-medium mb-1">Sending to</div>
                <div className="text-muted-foreground font-mono text-xs break-all">{recipient}</div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="text-2xl font-semibold pr-20"
                data-testid="input-amount"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {selectedToken?.symbol}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available: {parseFloat(selectedToken?.balance || "0").toFixed(4)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0"
                onClick={() => setAmount(selectedToken?.balance || "0")}
                data-testid="button-max-amount"
              >
                Max
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-4">
          {!txHash ? (
            <>
              <div className="glass-effect p-4 rounded-md space-y-3">
                <h3 className="font-semibold">Transaction Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-mono text-xs">{walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-mono text-xs">{recipient.substring(0, 10)}...{recipient.substring(recipient.length - 8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold flex items-center gap-2">
                      {amount}
                      <span className="flex items-center">
                        {selectedToken?.logoUrl ? (
                          <img src={selectedToken.logoUrl} alt={selectedToken.symbol} className="w-5 h-5 rounded-full" />
                        ) : selectedToken?.contractAddress === null ? (
                          <img src={`/images/${networkConfig.nativeToken}.png`} alt={networkConfig.nativeToken} className="w-5 h-5 rounded-full" />
                        ) : null}
                        <span className="ml-1">{selectedToken?.symbol}</span>
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Fee (estimated)</span>
                    <span className="font-medium">{parseFloat(gasEstimate).toFixed(6)} {networkConfig.nativeToken}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Token Type</span>
                    <span className="font-medium">{selectedToken?.contractAddress ? "ERC20" : "Native"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Wallet Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  data-testid="input-send-password"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">Transaction Sent!</div>
                  <div className="text-sm text-muted-foreground">
                    Your transaction is being processed. Redirecting to receipt...
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-send">
        <DialogHeader>
          <DialogTitle>
            Send {step > 1 && selectedToken ? selectedToken.symbol : "Tokens"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Choose which token to send"}
            {step === 2 && "Enter recipient address"}
            {step === 3 && "Enter amount to send"}
            {step === 4 && "Review and confirm transaction"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
                data-testid={`progress-step-${s}`}
              />
            ))}
          </div>

          {renderStepContent()}

          <div className="flex gap-3 pt-4">
            {step > 1 && !txHash && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={loading}
                data-testid="button-send-back"
              >
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="flex-1"
                disabled={loading}
                data-testid="button-send-next"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : !txHash ? (
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={loading || !password}
                data-testid="button-confirm-send"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  "Confirm Transaction"
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

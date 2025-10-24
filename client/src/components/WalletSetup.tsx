import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Eye, EyeOff, AlertCircle, Wallet, Key, FileText, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateWallet, importFromMnemonic, importFromPrivateKey, saveWallet } from "@/lib/wallet";

export default function WalletSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"choice" | "create" | "import">("choice");
  const [importMethod, setImportMethod] = useState<"mnemonic" | "privateKey">("mnemonic");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string; mnemonic?: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = () => {
    setError("");
    const wallet = generateWallet();
    setGeneratedWallet(wallet);
    setStep("create");
  };

  const handleSaveWallet = () => {
    if (!generatedWallet) return;
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      saveWallet(generatedWallet, password);
      toast({
        title: "Wallet Created",
        description: "Your wallet has been created and secured successfully.",
      });
      setLocation("/dashboard");
    } catch (err) {
      setError("Failed to save wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = () => {
    setError("");
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      let wallet;
      
      if (importMethod === "mnemonic") {
        wallet = importFromMnemonic(mnemonic.trim());
      } else {
        wallet = importFromPrivateKey(privateKey.trim());
      }
      
      saveWallet(wallet, password);
      toast({
        title: "Wallet Imported",
        description: "Your wallet has been imported successfully.",
      });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to import wallet. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  if (step === "choice") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                <img src="/images/MTT.png" className="w-14 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold gradient-text">Mintrax Wallet</h1>
            <p className="text-muted-foreground">Your gateway to MintraxChain</p>
          </div>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Create a new wallet or import an existing one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCreateWallet}
                className="w-full h-auto py-6"
                size="lg"
                data-testid="button-create-wallet"
              >
                <div className="flex flex-col items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">Create New Wallet</div>
                    <div className="text-xs opacity-90">Generate a new wallet with recovery phrase</div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => setStep("import")}
                variant="outline"
                className="w-full h-auto py-6"
                size="lg"
                data-testid="button-import-wallet"
              >
                <div className="flex flex-col items-center gap-2">
                  <Key className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">Import Wallet</div>
                    <div className="text-xs opacity-90">Use your recovery phrase or private key</div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "create" && generatedWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="w-full max-w-2xl space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Secure Your Wallet</CardTitle>
              <CardDescription>Save your recovery phrase and create a password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-warning bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm">
                  Write down your recovery phrase and store it in a safe place. You'll need it to recover your wallet.
                  Never share it with anyone.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Your Recovery Phrase</Label>
                <div className="glass-effect p-4 rounded-md">
                  <div className="grid grid-cols-3 gap-3">
                    {generatedWallet.mnemonic?.split(" ").map((word, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground font-mono">{idx + 1}.</span>
                        <span className="font-mono font-medium">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedWallet.mnemonic || "", "Recovery phrase")}
                  className="w-full mt-2"
                  data-testid="button-copy-mnemonic"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Recovery Phrase
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedWallet.address}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-wallet-address"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(generatedWallet.address, "Address")}
                    data-testid="button-copy-address"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("choice");
                    setGeneratedWallet(null);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveWallet}
                  disabled={loading || !password || !confirmPassword}
                  className="flex-1"
                  data-testid="button-save-wallet"
                >
                  {loading ? "Saving..." : "Secure Wallet"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Import Wallet</CardTitle>
            <CardDescription>Import your existing wallet using recovery phrase or private key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as "mnemonic" | "privateKey")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mnemonic" data-testid="tab-mnemonic">
                  <FileText className="w-4 h-4 mr-2" />
                  Recovery Phrase
                </TabsTrigger>
                <TabsTrigger value="privateKey" data-testid="tab-private-key">
                  <Key className="w-4 h-4 mr-2" />
                  Private Key
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mnemonic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mnemonic">Recovery Phrase</Label>
                  <textarea
                    id="mnemonic"
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="Enter your 12 or 24 word recovery phrase"
                    className="w-full min-h-[120px] p-3 rounded-md border bg-background font-mono text-sm resize-none"
                    data-testid="input-mnemonic"
                  />
                  <p className="text-xs text-muted-foreground">Separate words with spaces</p>
                </div>
              </TabsContent>
              <TabsContent value="privateKey" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input
                    id="privateKey"
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key (with or without 0x prefix)"
                    className="font-mono"
                    data-testid="input-private-key"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="importPassword">Create Password</Label>
                <div className="relative">
                  <Input
                    id="importPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    data-testid="input-import-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-import-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="importConfirmPassword">Confirm Password</Label>
                <Input
                  id="importConfirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  data-testid="input-import-confirm-password"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("choice");
                  setMnemonic("");
                  setPrivateKey("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1"
                data-testid="button-import-back"
              >
                Back
              </Button>
              <Button
                onClick={handleImportWallet}
                disabled={loading || !password || !confirmPassword || (importMethod === "mnemonic" ? !mnemonic : !privateKey)}
                className="flex-1"
                data-testid="button-import-submit"
              >
                {loading ? "Importing..." : "Import Wallet"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

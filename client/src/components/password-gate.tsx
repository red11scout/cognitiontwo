import { useState, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import logoWhite from "@assets/image_1770385886240.png";
import logoDark from "@assets/image_1770385904143.png";

const TOKEN_KEY = "czb_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch("/api/auth/check", {
        headers: { "x-auth-token": token },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            setAuthenticated(true);
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setAuthenticated(true);
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #001278 0%, #0a1e5e 40%, #02a2fd 100%)" }}>
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <img
                src={logoDark}
                alt="BlueAlly"
                className="h-10 object-contain dark:hidden"
              />
              <img
                src={logoWhite}
                alt="BlueAlly"
                className="h-10 object-contain hidden dark:block"
              />
              <span className="text-sm font-medium text-muted-foreground tracking-wide">AI</span>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {error && (
                <p data-testid="text-error" className="text-sm text-destructive text-center">
                  {error}
                </p>
              )}

              <Button
                data-testid="button-login"
                type="submit"
                className="w-full"
                disabled={loading || !password}
              >
                {loading ? "Verifying..." : "Access Platform"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

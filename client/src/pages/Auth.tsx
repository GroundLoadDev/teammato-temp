import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase magic link auth
    console.log("Magic link auth for:", email);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-semibold mb-2 text-center" data-testid="text-auth-title">
          Sign In
        </h1>
        <p className="text-muted-foreground mb-8 text-center" data-testid="text-auth-subtitle">
          Enter your email for a magic link (secondary auth method)
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              type="email" 
              placeholder="you@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
            <Button type="submit" className="w-full gap-2" data-testid="button-send-magic-link">
              <Mail className="w-4 h-4" />
              Send Magic Link
            </Button>
          </form>
        ) : (
          <div className="p-6 rounded-md border bg-card text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2" data-testid="text-check-email">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a magic link to <strong>{email}</strong>. Click the link to sign in.
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center mt-8">
          Primary auth is via Slack OAuth. This is a fallback method.
        </p>
      </div>
    </div>
  );
}

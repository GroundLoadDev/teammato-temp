import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-semibold mb-4" data-testid="text-contact-title">Contact Us</h1>
        <p className="text-muted-foreground mb-12" data-testid="text-contact-subtitle">
          Have questions? We'd love to hear from you.
        </p>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="name">Name</label>
            <Input id="name" placeholder="Your name" data-testid="input-name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="email">Email</label>
            <Input id="email" type="email" placeholder="you@company.com" data-testid="input-email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="message">Message</label>
            <Textarea id="message" placeholder="How can we help?" className="min-h-32" data-testid="input-message" />
          </div>
          <Button className="w-full gap-2" data-testid="button-submit">
            <Mail className="w-4 h-4" />
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}

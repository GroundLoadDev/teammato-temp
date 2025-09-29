import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      q: "How does k-anonymity protect user privacy?",
      a: "Content remains hidden until at least k≥5 unique participants contribute to a thread. This ensures no individual can be identified from their feedback."
    },
    {
      q: "What encryption do you use?",
      a: "We use AEAD (XChaCha20-Poly1305 or AES-GCM) with per-organization keys stored securely server-side. Content is encrypted at rest."
    },
    {
      q: "Can admins see who posted feedback?",
      a: "No. We use pseudonymous handles and actor hashes. Admin logs never contain poster identity. Only aggregated analytics are available."
    },
    {
      q: "How does Slack integration work?",
      a: "Install via OAuth, then use slash commands to submit feedback directly from Slack. All privacy guarantees remain intact."
    },
    {
      q: "What is your data retention policy?",
      a: "Customizable per organization (default 365 days). Legal hold can freeze retention for compliance needs."
    }
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-semibold mb-4" data-testid="text-faq-title">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-12" data-testid="text-faq-subtitle">
          Everything you need to know about Teammato's privacy-first feedback system
        </p>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-md px-6" data-testid={`accordion-item-${i}`}>
              <AccordionTrigger className="hover:no-underline" data-testid={`accordion-trigger-${i}`}>
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid={`accordion-content-${i}`}>
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

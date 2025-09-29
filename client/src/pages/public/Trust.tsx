import { Shield, Lock, Server, FileCheck } from "lucide-react";

export default function Trust() {
  const features = [
    {
      icon: Shield,
      title: "SOC 2 Compliant",
      desc: "Annual audits ensure security controls meet industry standards"
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      desc: "AEAD encryption with per-org keys, zero-knowledge architecture"
    },
    {
      icon: Server,
      title: "Multi-Tenant Isolation",
      desc: "Row-level security (RLS) ensures complete data separation"
    },
    {
      icon: FileCheck,
      title: "GDPR & CCPA Ready",
      desc: "Data export, deletion, and retention controls built-in"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-semibold mb-4" data-testid="text-trust-title">Trust & Security</h1>
        <p className="text-muted-foreground mb-12" data-testid="text-trust-subtitle">
          Enterprise-grade security and compliance for your peace of mind
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, i) => (
            <div key={i} className="p-6 rounded-md border bg-card" data-testid={`card-trust-${i}`}>
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h2>Our Commitment</h2>
          <p>
            Teammato is designed from the ground up with privacy and security as core principles. 
            We employ k-anonymity, encryption, and strict access controls to ensure anonymous feedback 
            remains truly anonymous.
          </p>
          
          <h3>Security Practices</h3>
          <ul>
            <li>Regular penetration testing and security audits</li>
            <li>Encrypted data at rest and in transit (TLS 1.3)</li>
            <li>Automated vulnerability scanning</li>
            <li>24/7 security monitoring and incident response</li>
          </ul>

          <h3>Compliance</h3>
          <p>
            We maintain compliance with GDPR, CCPA, SOC 2, and industry-specific regulations. 
            Our data processing agreements and business associate agreements are available upon request.
          </p>
        </div>
      </div>
    </div>
  );
}

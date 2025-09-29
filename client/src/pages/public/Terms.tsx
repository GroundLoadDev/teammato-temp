export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <h1 data-testid="text-terms-title">Terms of Service</h1>
        <p className="lead" data-testid="text-terms-intro">
          Last updated: September 29, 2025
        </p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using Teammato, you accept and agree to be bound by the terms and 
          provision of this agreement.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to use Teammato for internal anonymous feedback within your organization. 
          This license shall automatically terminate if you violate any of these restrictions.
        </p>

        <h2>3. Privacy and Anonymity</h2>
        <p>
          Teammato guarantees k-anonymity protection and encryption of feedback. We do not store 
          identifiable information with content. See our Privacy Policy for details.
        </p>

        <h2>4. User Responsibilities</h2>
        <ul>
          <li>Maintain the confidentiality of your account</li>
          <li>Do not post illegal, harmful, or threatening content</li>
          <li>Respect the anonymous nature of the platform</li>
          <li>Comply with your organization's policies</li>
        </ul>

        <h2>5. Moderation</h2>
        <p>
          Organizations may moderate content for policy violations. Moderation actions are logged 
          without revealing poster identity.
        </p>

        <h2>6. Service Availability</h2>
        <p>
          We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance 
          will be communicated in advance.
        </p>

        <h2>7. Termination</h2>
        <p>
          Either party may terminate service with 30 days notice. Data export is available before termination.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          Teammato shall not be liable for any indirect, incidental, or consequential damages arising 
          from use of the service.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms. Users will be notified of significant changes.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these terms? Contact us at legal@teammato.com
        </p>
      </div>
    </div>
  );
}

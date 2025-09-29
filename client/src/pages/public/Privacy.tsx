export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <h1 data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="lead" data-testid="text-privacy-intro">
          Teammato is built with privacy as the foundation. This policy explains how we protect your data.
        </p>
        
        <h2>Data We Collect</h2>
        <p>We collect minimal data necessary for the service:</p>
        <ul>
          <li>Organization information (name, verified domains)</li>
          <li>User emails for authentication (stored separately from content)</li>
          <li>Encrypted feedback content with pseudonymous handles</li>
          <li>Aggregated analytics (no individual identification)</li>
        </ul>

        <h2>How We Protect Privacy</h2>
        <ul>
          <li><strong>K-Anonymity:</strong> Content hidden until k≥5 participants</li>
          <li><strong>Encryption:</strong> Per-org AEAD encryption at rest</li>
          <li><strong>Pseudonyms:</strong> No real names in content tables</li>
          <li><strong>No IP/UA logging:</strong> No tracking in feedback tables</li>
        </ul>

        <h2>Data Retention</h2>
        <p>Organizations control retention periods (default 365 days). Legal hold available for compliance.</p>

        <h2>Third-Party Services</h2>
        <p>We use Supabase (database), Stripe (billing), and Slack (integration). All adhere to strict privacy standards.</p>
      </div>
    </div>
  );
}

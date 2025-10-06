import LegalDocument, { LegalSection } from "@/components/LegalDocument";

const dpaSections: LegalSection[] = [
  {
    id: "purpose",
    title: "1. Purpose and Scope",
    content: [
      "1.1 Purpose. This Data Processing Addendum (\"DPA\") forms part of the Teammato Terms of Service (\"Agreement\") between Customer and Teammato, LLC (\"Teammato\") and governs the processing of Personal Data by Teammato on behalf of Customer.",
      "1.2 Scope. This DPA applies where and to the extent that Teammato processes Personal Data subject to Data Protection Laws on behalf of Customer in the course of providing the Services.",
      "1.3 Incorporation. This DPA is incorporated into and forms part of the Agreement. In the event of any conflict between this DPA and the Agreement with respect to processing of Personal Data, the terms of this DPA shall prevail.",
      "1.4 Legal Effect. The parties agree that this DPA shall be the Data Processing Agreement for purposes of the GDPR, UK GDPR, and other applicable Data Protection Laws.",
    ],
  },
  {
    id: "definitions",
    title: "2. Definitions",
    content: [
      "\"Authorized Subprocessor\" means a third party authorized by Customer to process Personal Data in accordance with Section 7.",
      "\"Controller\" means the entity that determines the purposes and means of the processing of Personal Data.",
      "\"Data Protection Laws\" means all applicable laws and regulations relating to privacy, data protection, and data security, including (as applicable) the GDPR, UK GDPR, CCPA, and other similar laws.",
      "\"Data Subject\" means an identified or identifiable natural person to whom Personal Data relates.",
      "\"Data Subject Request\" means a request from a Data Subject to exercise their rights under Data Protection Laws (e.g., access, rectification, erasure, portability, restriction, objection).",
      "\"GDPR\" means Regulation (EU) 2016/679 of the European Parliament and of the Council (General Data Protection Regulation).",
      "\"Personal Data\" means any information relating to an identified or identifiable natural person that is processed by Teammato under this DPA.",
      "\"Personal Data Breach\" means a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Personal Data.",
      "\"Processing\" has the meaning given in the GDPR and \"process,\" \"processes,\" and \"processed\" shall be interpreted accordingly.",
      "\"Processor\" means the entity that processes Personal Data on behalf of the Controller.",
      "\"Standard Contractual Clauses\" or \"SCCs\" means the standard contractual clauses for the transfer of Personal Data to third countries approved by the European Commission or UK authorities.",
      "\"Subprocessor\" means any Processor engaged by Teammato to process Personal Data.",
      "\"UK GDPR\" means the GDPR as incorporated into UK law by the UK Data Protection Act 2018.",
    ],
  },
  {
    id: "roles",
    title: "3. Roles and Responsibilities",
    content: [
      "3.1 Roles. Customer is the Controller of Personal Data, and Teammato is the Processor. Each party shall comply with its obligations under Data Protection Laws applicable to its role.",
      "3.2 Customer Responsibilities. Customer represents and warrants that: (a) it has provided all necessary notices and obtained all necessary consents and rights to allow Teammato to process Personal Data as described in this DPA; (b) its instructions to Teammato comply with Data Protection Laws; and (c) it has implemented appropriate technical and organizational measures as Controller.",
      "3.3 Processing Instructions. Teammato shall process Personal Data only: (a) on documented instructions from Customer (including those set forth in the Agreement and this DPA); (b) to comply with applicable law; or (c) with Customer's prior written consent. If Teammato is required by law to process Personal Data otherwise, Teammato shall notify Customer before processing (unless prohibited by law).",
      "3.4 Prohibited Data. Customer shall not provide to Teammato, and Teammato shall have no liability for: (a) special categories of data under GDPR Article 9 (e.g., health data, biometric data, genetic data); (b) Personal Data of children without appropriate legal basis; or (c) data subject to sector-specific regulations not covered by the Services (e.g., HIPAA PHI, PCI DSS primary account numbers).",
    ],
  },
  {
    id: "data-processing",
    title: "4. Details of Data Processing",
    content: [
      "4.1 Subject Matter. The processing of Personal Data as necessary to provide the Services under the Agreement.",
      "4.2 Duration. The term of the Agreement, and thereafter until all Personal Data is deleted or returned in accordance with Section 11.",
      "4.3 Nature and Purpose. Teammato processes Personal Data to provide anonymous feedback collection, aggregation, moderation, and analytics services via Slack integration.",
      "4.4 Types of Personal Data. Slack user IDs, workspace identifiers, email addresses (for admin notifications), pseudonymized feedback content (encrypted), submission timestamps, and usage telemetry (excluding message content).",
      "4.5 Categories of Data Subjects. Customer's employees, contractors, and other authorized Users within the Customer's Slack workspace.",
    ],
  },
  {
    id: "security",
    title: "5. Security Measures",
    content: [
      "5.1 Technical and Organizational Measures. Teammato shall implement and maintain appropriate technical and organizational measures to protect Personal Data against Personal Data Breaches, taking into account the state of the art, costs of implementation, nature, scope, context, and purposes of processing, and risk to Data Subjects.",
      "5.2 Security Measures. Such measures include, but are not limited to:",
      "• Encryption at Rest: XChaCha20-Poly1305 AEAD encryption with per-organization 256-bit DEKs (Data Encryption Keys) stored in a secure key management system.",
      "• Encryption in Transit: TLS 1.2+ for all data transmission.",
      "• Access Control: Role-based access control (RBAC) with least-privilege principles; multi-factor authentication for administrative access.",
      "• Pseudonymization: Daily-rotating submitter hashes and suppression of identifiable metadata.",
      "• K-Anonymity Enforcement: Database-level views and application-layer enforcement ensuring k≥5 threshold for all exports and analytics.",
      "• Multi-Tenant Isolation: Row-level security (RLS) using PostgreSQL policies scoped by org_id from JWT claims.",
      "• PII Filtering: Automated content filtering to detect and redact @mentions, email addresses, and other PII patterns.",
      "• Logging Controls: Content-free telemetry; no plaintext message content stored in logs.",
      "• Incident Response: Documented procedures for detection, containment, and notification of Personal Data Breaches.",
      "• Vulnerability Management: Regular security assessments, automated dependency scanning, and third-party penetration testing.",
      "• Personnel Security: Background checks (where legally permissible), confidentiality agreements, and security awareness training.",
      "5.3 Assistance. Upon Customer's written request and subject to reasonable confidentiality obligations, Teammato will provide Customer with information reasonably necessary to demonstrate compliance with Article 32 GDPR (security of processing).",
    ],
  },
  {
    id: "security-breach",
    title: "6. Personal Data Breach Notification",
    content: [
      "6.1 Notification. Upon becoming aware of a confirmed Personal Data Breach, Teammato shall notify Customer without undue delay and in any event within 72 hours of confirmation.",
      "6.2 Details. Such notification shall include, to the extent available: (a) nature of the breach, including categories and approximate number of Data Subjects and Personal Data records affected; (b) likely consequences; (c) measures taken or proposed to address the breach and mitigate harm; and (d) contact details for further information.",
      "6.3 Investigation and Remediation. Teammato shall investigate the Personal Data Breach and take reasonable steps to remediate and mitigate the effects. Teammato shall cooperate with Customer and provide reasonable assistance for Customer to comply with its breach notification obligations under Data Protection Laws.",
      "6.4 No Acknowledgment of Fault. Notification of or response to a Personal Data Breach under this Section 6 shall not be construed as an acknowledgment of fault or liability by Teammato.",
    ],
  },
  {
    id: "subprocessors",
    title: "7. Subprocessors",
    content: [
      "7.1 Authorized Subprocessors. Customer consents to Teammato's use of Subprocessors to process Personal Data, provided Teammato: (a) enters into a written agreement with each Subprocessor imposing data protection obligations no less protective than this DPA; and (b) remains liable for the Subprocessor's compliance.",
      "7.2 Current Subprocessors. The list of current Subprocessors is available at teammato.com/subprocessors (or upon request to Trust@teammato.com) and includes:",
      "• Neon (Neon, Inc.) – Database hosting (PostgreSQL)",
      "• Supabase (Supabase, Inc.) – Serverless functions and authentication infrastructure",
      "• Slack (Slack Technologies, LLC) – Messaging platform integration",
      "• Stripe (Stripe, Inc.) – Payment processing",
      "• Resend (Resend, Inc.) – Transactional email delivery",
      "7.3 Notice of New Subprocessors. Teammato shall provide Customer with at least 30 days' prior notice (via email to Admin or in-product notice) before authorizing any new Subprocessor or replacing an existing Subprocessor.",
      "7.4 Objection. Customer may object to a new or replacement Subprocessor on reasonable data protection grounds by notifying Teammato in writing within 15 days of receipt of notice. If Customer objects, the parties shall work together in good faith to find a commercially reasonable solution. If no solution is found within 30 days, Customer may terminate the affected Services and receive a pro-rata refund of prepaid, unused fees.",
    ],
  },
  {
    id: "data-subject-rights",
    title: "8. Data Subject Rights",
    content: [
      "8.1 Assistance. Teammato shall, taking into account the nature of processing, provide reasonable assistance to Customer (at Customer's expense) to enable Customer to respond to Data Subject Requests, including requests for access, rectification, erasure, data portability, restriction of processing, and objection.",
      "8.2 Direct Requests. If Teammato receives a Data Subject Request directly, Teammato shall promptly inform Customer and shall not respond to the request except on Customer's documented instructions or as required by law.",
      "8.3 Technical Limitations. The parties acknowledge that due to the Services' privacy-by-design architecture (encryption, pseudonymization, k-anonymity), certain Data Subject Requests may be technically infeasible to fulfill (e.g., individual identification of pseudonymized feedback). In such cases, Teammato shall inform Customer and document the technical infeasibility.",
    ],
  },
  {
    id: "international-transfers",
    title: "9. International Data Transfers",
    content: [
      "9.1 Transfers. Customer acknowledges that Teammato may transfer Personal Data to countries outside the European Economic Area (EEA) or United Kingdom as necessary to provide the Services.",
      "9.2 Transfer Mechanisms. Where Teammato transfers Personal Data from the EEA or UK to countries not recognized as providing adequate protection, Teammato shall ensure such transfers are subject to appropriate safeguards under Data Protection Laws, including:",
      "• Standard Contractual Clauses (SCCs) approved by the European Commission or UK authorities, as applicable.",
      "• Binding Corporate Rules, adequacy decisions, or other legally recognized transfer mechanisms.",
      "9.3 Supplementary Measures. Teammato implements supplementary technical and organizational measures to ensure a level of protection essentially equivalent to that guaranteed within the EEA and UK, including encryption (XChaCha20-Poly1305 AEAD), access controls, and pseudonymization.",
      "9.4 SCCs Incorporation. Upon Customer's request, the parties agree to execute the SCCs. Where the SCCs apply, they are hereby incorporated by reference and shall take precedence over any conflicting provisions of this DPA.",
    ],
  },
  {
    id: "audits",
    title: "10. Audits and Compliance",
    content: [
      "10.1 Records. Teammato shall maintain records of processing activities as required by Article 30 GDPR and make such records available to Customer or competent supervisory authorities upon request.",
      "10.2 Audit Rights. Customer may, upon 30 days' prior written notice and no more than once per year (unless required by a supervisory authority or in response to a Personal Data Breach), audit Teammato's compliance with this DPA. Such audits shall: (a) be conducted during business hours and in a manner that does not unreasonably interfere with Teammato's operations; (b) be subject to reasonable confidentiality obligations; and (c) be at Customer's expense.",
      "10.3 Third-Party Certifications. In lieu of an audit, Teammato may provide Customer with: (a) a copy of Teammato's most recent SOC 2 Type II report or equivalent third-party audit report; (b) evidence of compliance with ISO 27001 or similar certification; or (c) other documentation demonstrating compliance with this DPA.",
      "10.4 Remediation. If an audit or certification reveals non-compliance, Teammato shall, at its own expense, use commercially reasonable efforts to remediate such non-compliance within a reasonable timeframe.",
    ],
  },
  {
    id: "data-return-deletion",
    title: "11. Data Return and Deletion",
    content: [
      "11.1 Return or Deletion. Upon termination or expiration of the Agreement, or upon Customer's written request, Teammato shall (at Customer's election) return all Personal Data to Customer in a commonly used, machine-readable format, or securely delete all Personal Data, and certify such deletion in writing.",
      "11.2 Retention Period. Customer may specify a retention period (30, 90, 365 days, or custom) in the Admin console. After the retention period, Personal Data shall be irreversibly deleted or de-identified.",
      "11.3 Legal Retention. Teammato may retain Personal Data to the extent required by applicable law (e.g., tax, audit, regulatory obligations) and solely for the duration and purposes required by such law. Such retained data shall remain subject to confidentiality and security obligations.",
      "11.4 Deletion Method. Deletion shall be performed using cryptographic erasure (deletion of encryption keys) and, where technically feasible, physical deletion of data from storage media.",
    ],
  },
  {
    id: "dpias",
    title: "12. Data Protection Impact Assessments and Consultations",
    content: [
      "12.1 Assistance. Teammato shall, at Customer's request and expense, provide reasonable assistance to Customer in conducting Data Protection Impact Assessments (DPIAs) and prior consultations with supervisory authorities as required under Data Protection Laws.",
      "12.2 Information. Teammato shall provide Customer with information reasonably necessary for such assessments and consultations, including details of processing operations, security measures, and Subprocessor arrangements.",
    ],
  },
  {
    id: "liability",
    title: "13. Liability",
    content: [
      "13.1 Liability Cap. Each party's liability under this DPA shall be subject to the limitations of liability set forth in the Agreement, except where such limitations are prohibited by Data Protection Laws.",
      "13.2 GDPR Liability. Under the GDPR, each party shall be liable for damages caused by processing that violates the GDPR, subject to the exemptions and limitations set forth in Articles 82-83 GDPR.",
      "13.3 Indemnification. To the extent permitted by law, Teammato shall indemnify and hold harmless Customer from and against any fines, penalties, or damages imposed by a supervisory authority directly arising from Teammato's breach of its obligations under this DPA, subject to the limitations in the Agreement.",
    ],
  },
  {
    id: "term-termination",
    title: "14. Term and Termination",
    content: [
      "14.1 Term. This DPA shall commence on the Effective Date of the Agreement and continue until the earlier of: (a) termination or expiration of the Agreement; or (b) deletion of all Personal Data in accordance with Section 11.",
      "14.2 Survival. Sections 5 (Security), 6 (Breach Notification), 10 (Audits), 11 (Data Return/Deletion), and 13 (Liability) shall survive termination or expiration of this DPA to the extent necessary to fulfill their purposes.",
    ],
  },
  {
    id: "general",
    title: "15. General Provisions",
    content: [
      "15.1 Governing Law. This DPA shall be governed by the laws specified in the Agreement, except to the extent Data Protection Laws require otherwise.",
      "15.2 Amendments. Teammato may amend this DPA to reflect changes in Data Protection Laws or supervisory authority guidance, provided such amendments do not reduce the level of protection for Personal Data. Material changes shall be notified to Customer with at least 30 days' notice.",
      "15.3 Conflict. In the event of conflict between this DPA and the Agreement with respect to processing of Personal Data, this DPA shall prevail. In the event of conflict between this DPA and the SCCs, the SCCs shall prevail.",
      "15.4 Severability. If any provision of this DPA is held invalid or unenforceable, the remaining provisions shall remain in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it enforceable.",
      "15.5 Notices. Notices under this DPA shall be sent to Trust@teammato.com (for Teammato) and to Customer's Admin email address on record.",
    ],
  },
  {
    id: "contact",
    title: "16. Contact and Requests",
    content: [
      "For all DPA-related inquiries, Data Subject Requests, Personal Data Breach notifications, audit requests, or other compliance matters, contact:",
      "Trust & Security Team: Trust@teammato.com",
      "Mailing Address: [To be provided upon request]",
      "By executing the Agreement, Customer acknowledges and agrees to this DPA as the governing framework for Personal Data processing.",
    ],
  },
];

export default function DPA() {
  const introduction = `This Data Processing Addendum ("DPA") supplements the Teammato Terms of Service and governs how Teammato processes Personal Data on behalf of Customer organizations. This DPA addresses requirements under the EU General Data Protection Regulation (GDPR), UK GDPR, California Consumer Privacy Act (CCPA), and other applicable data protection laws. By using Teammato's Services, Customer agrees to the terms set forth in this DPA.`;
  
  return (
    <LegalDocument
      title="Data Processing Addendum (DPA)"
      effectiveDate="October 6, 2025"
      introduction={introduction}
      sections={dpaSections}
      downloadFilename="teammato-dpa.txt"
    />
  );
}

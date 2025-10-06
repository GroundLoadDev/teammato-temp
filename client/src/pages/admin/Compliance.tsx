import { Shield, Download, Trash2, Clock, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Compliance() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-compliance-title">
          Compliance & Privacy
        </h1>
        <p className="text-muted-foreground">
          Manage data retention, export controls, and compliance documentation
        </p>
      </div>

      {/* GDPR & Privacy Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-data-retention">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Data Retention
            </CardTitle>
            <CardDescription>Control how long feedback data is stored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Current Policy</span>
                <Badge>365 days</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Feedback threads older than 365 days are automatically archived and anonymized further.
              </p>
            </div>
            <Link href="/admin/retention">
              <Button variant="outline" className="w-full" data-testid="button-configure-retention">
                Configure Policy
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card data-testid="card-data-export">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Export
            </CardTitle>
            <CardDescription>Export k-safe feedback data for compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Export threads, comments, and audit logs in CSV or JSON format for audits or GDPR requests. All exports enforce k-anonymity at the database level via view-based filtering.
              </p>
            </div>
            <Link href="/admin/export">
              <Button variant="outline" className="w-full" data-testid="button-export-data">
                Export Data
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Architecture */}
      <Card data-testid="card-privacy-architecture">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Privacy Architecture
          </CardTitle>
          <CardDescription>How Teammato protects contributor anonymity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <Lock className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-semibold mb-1">K-Anonymity</h3>
              <p className="text-sm text-muted-foreground">
                Threads require 5+ participants before visibility, preventing re-identification
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <Shield className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-semibold mb-1">No PII Storage</h3>
              <p className="text-sm text-muted-foreground">
                Real names and identifiable data never stored in feedback content
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <FileText className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-semibold mb-1">Content Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Automatic detection and blocking of @mentions and PII in submissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Documentation */}
      <Card data-testid="card-compliance-docs">
        <CardHeader>
          <CardTitle>Compliance Documentation</CardTitle>
          <CardDescription>Download legal and security documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <h3 className="font-medium">Data Processing Agreement (DPA)</h3>
                <p className="text-sm text-muted-foreground">GDPR-compliant DPA for enterprises</p>
              </div>
              <a href="/Teammato_DPA.pdf" download>
                <Button variant="outline" size="sm" data-testid="button-download-dpa">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <h3 className="font-medium">Security Whitepaper</h3>
                <p className="text-sm text-muted-foreground">K-anonymity and encryption architecture</p>
              </div>
              <Link href="/trust">
                <Button variant="outline" size="sm" data-testid="button-view-security">
                  View
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <h3 className="font-medium">Privacy Policy</h3>
                <p className="text-sm text-muted-foreground">How we handle and protect data</p>
              </div>
              <Link href="/privacy">
                <Button variant="outline" size="sm" data-testid="button-view-privacy">
                  View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Deletion Request */}
      <Card className="border-destructive/50" data-testid="card-data-deletion">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Data Deletion Request
          </CardTitle>
          <CardDescription>
            Permanently delete all organization data (irreversible)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This action will permanently delete all feedback threads, topics, user data, and organization settings. 
            This cannot be undone and is typically used for GDPR "right to be forgotten" requests.
          </p>
          <Button variant="destructive" data-testid="button-request-deletion">
            Request Data Deletion
          </Button>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-lg mb-1">Need compliance assistance?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our privacy team for GDPR, CCPA, or custom compliance needs.
              </p>
            </div>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-privacy">
                Contact Privacy Team
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

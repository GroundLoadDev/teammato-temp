import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export default function Export() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2" data-testid="text-export-title">Export Data</h1>
      <p className="text-muted-foreground mb-8" data-testid="text-export-subtitle">
        Download aggregated analytics and content (privacy-preserving)
      </p>

      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-md border bg-card">
          <h3 className="font-semibold mb-4">Analytics Export</h3>
          <div className="space-y-4">
            <div>
              <Label>Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger className="mt-2" data-testid="select-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Range</Label>
              <Select defaultValue="30d">
                <SelectTrigger className="mt-2" data-testid="select-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full gap-2" data-testid="button-export-analytics">
              <Download className="w-4 h-4" />
              Export Analytics
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-md border bg-card">
          <h3 className="font-semibold mb-4">Content Export</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Exports anonymized content with pseudonyms. No identifiable information included.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full gap-2 justify-start" data-testid="button-export-threads">
              <FileText className="w-4 h-4" />
              Export Threads
            </Button>
            <Button variant="outline" className="w-full gap-2 justify-start" data-testid="button-export-comments">
              <FileText className="w-4 h-4" />
              Export Comments
            </Button>
            <Button variant="outline" className="w-full gap-2 justify-start" data-testid="button-export-audit">
              <FileSpreadsheet className="w-4 h-4" />
              Export Audit Log
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-md bg-muted">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> All exports are privacy-preserving. Pseudonymous handles are used, and no IP addresses or user identities are included.
          </p>
        </div>
      </div>
    </div>
  );
}

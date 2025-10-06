import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Export() {
  const { toast } = useToast();
  const [format, setFormat] = useState("csv");
  const [timeRange, setTimeRange] = useState("30d");

  const exportAnalytics = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/export/analytics', { format, timeRange });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, '_blank');
      } else if (data.data) {
        const mimeType = format === 'json' ? 'application/json' : 'text/csv';
        const blob = new Blob([data.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful",
          description: "Your analytics export is ready.",
        });
      } else {
        toast({
          title: "Export incomplete",
          description: "No data was returned from the export.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export analytics. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportThreads = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/export/threads', {});
    },
    onSuccess: (data: any) => {
      if (data.data) {
        const blob = new Blob([data.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `threads-export.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast({
        title: "Export successful",
        description: "Your threads export is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export threads. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportComments = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/export/comments', {});
    },
    onSuccess: (data: any) => {
      if (data.data) {
        const blob = new Blob([data.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comments-export.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast({
        title: "Export successful",
        description: "Your comments export is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export comments. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportAudit = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/export/audit', {});
    },
    onSuccess: (data: any) => {
      if (data.data) {
        const blob = new Blob([data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-export.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast({
        title: "Export successful",
        description: "Your audit log export is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export audit log. Please try again.",
        variant: "destructive",
      });
    },
  });

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
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="mt-2" data-testid="select-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
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

            <Button 
              className="w-full gap-2" 
              onClick={() => exportAnalytics.mutate()}
              disabled={exportAnalytics.isPending}
              data-testid="button-export-analytics"
            >
              {exportAnalytics.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Analytics
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-md border bg-card">
          <h3 className="font-semibold mb-4">Content Export</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Exports anonymized content with pseudonyms. No identifiable information included.
          </p>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full gap-2 justify-start"
              onClick={() => exportThreads.mutate()}
              disabled={exportThreads.isPending}
              data-testid="button-export-threads"
            >
              {exportThreads.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Export Threads
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full gap-2 justify-start"
              onClick={() => exportComments.mutate()}
              disabled={exportComments.isPending}
              data-testid="button-export-comments"
            >
              {exportComments.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Export Comments
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full gap-2 justify-start"
              onClick={() => exportAudit.mutate()}
              disabled={exportAudit.isPending}
              data-testid="button-export-audit"
            >
              {exportAudit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Audit Log
                </>
              )}
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

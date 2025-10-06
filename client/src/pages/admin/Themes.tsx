import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeCard, ThemeCardProps } from "@/components/ThemeCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sparkles, Calendar, RefreshCw, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PeriodType = 'week' | 'month';

function getDateRange(periodType: PeriodType): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (periodType === 'week') {
    start.setDate(now.getDate() - 7);
  } else {
    start.setMonth(now.getMonth() - 1);
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export default function Themes() {
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const dateRange = getDateRange(periodType);

  const { data: themes, isLoading, refetch } = useQuery<ThemeCardProps[]>({
    queryKey: ['/api/themes', dateRange],
    enabled: true,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/themes/generate', {
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
      });
    },
    onSuccess: () => {
      toast({
        title: "Theme generation started",
        description: "Themes will be available shortly. This may take up to 60 seconds for large datasets.",
      });
      setTimeout(() => {
        refetch();
      }, 5000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      let title = "Generation failed";
      let description = "Unable to generate themes. Please try again.";
      
      if (errorMessage.includes('k-anonymity') || errorMessage.includes('threshold')) {
        title = "Not enough participants";
        description = "Theme generation requires meeting k-anonymity thresholds. Wait for more feedback submissions.";
      } else if (errorMessage.includes('no feedback') || errorMessage.includes('insufficient data')) {
        title = "Insufficient feedback data";
        description = "No feedback found for this period. Try selecting a different time range or wait for more submissions.";
      } else if (errorMessage.includes('disabled') || errorMessage.includes('feature')) {
        title = "Feature not enabled";
        description = "Theme generation is not enabled for your organization. Contact your administrator.";
      } else if (errorMessage.includes('processing') || errorMessage.includes('timeout')) {
        title = "Processing timeout";
        description = "Theme generation took too long. Try a shorter time period or fewer data points.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-600/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold" data-testid="text-themes-title">
                Themes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered feedback clustering with local CPU processing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Period:</span>
            </div>
            <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
              <SelectTrigger className="w-32" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {dateRange.start} to {dateRange.end}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-generate"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Themes'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Banner */}
      <Card className="p-4 mb-6 bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">
              Zero-cost local processing
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Themes are generated using local CPU-based embeddings (all-MiniLM-L6-v2) with agglomerative clustering. 
              No external APIs, no LLM costs. Quotes shown only when k-anonymity threshold is met (k≥10).
            </p>
          </div>
        </div>
      </Card>

      {/* Themes Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" data-testid={`theme-skeleton-${i}`} />
          ))}
        </div>
      ) : themes && themes.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {themes.map((theme) => (
            <ThemeCard key={theme.id} {...theme} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-themes">
            No themes found
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generate themes for this period to see feedback patterns and insights
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-generate-empty"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Themes
          </Button>
        </Card>
      )}
    </div>
  );
}

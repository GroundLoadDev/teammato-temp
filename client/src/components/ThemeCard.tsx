import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Hash } from "lucide-react";

export interface ThemeCardProps {
  id: string;
  label: string;
  posts_count: number;
  top_terms: string[];
  summary: string;
  trend_delta?: number;
  channels: string[];
  dept_hits: Record<string, number>;
  k_threshold: number;
  exemplar_quotes?: { text: string }[];
}

export function ThemeCard({ 
  id, 
  label, 
  posts_count, 
  top_terms, 
  summary, 
  trend_delta, 
  channels,
  dept_hits,
  k_threshold,
  exemplar_quotes 
}: ThemeCardProps) {
  const meetsK = posts_count >= k_threshold;
  const showTrend = trend_delta !== undefined && trend_delta !== 0;

  return (
    <Card className="p-6 hover-elevate" data-testid={`theme-card-${id}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold" data-testid={`theme-label-${id}`}>
                {label}
              </h3>
              {showTrend && (
                <div className="flex items-center gap-1 text-sm">
                  {trend_delta > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">+{trend_delta}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-medium">{trend_delta}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span data-testid={`theme-count-${id}`}>{posts_count} posts</span>
              {!meetsK && (
                <Badge variant="secondary" className="text-xs" data-testid={`theme-k-warning-${id}`}>
                  Below k={k_threshold}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`theme-summary-${id}`}>
          {summary}
        </p>

        {/* Top Terms */}
        {top_terms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {top_terms.map((term, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                data-testid={`theme-term-${id}-${i}`}
              >
                {term}
              </Badge>
            ))}
          </div>
        )}

        {/* Channels */}
        {channels.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Channels:</span>
            <div className="flex flex-wrap gap-1">
              {channels.slice(0, 3).map((channel, i) => (
                <span key={i} className="text-foreground" data-testid={`theme-channel-${id}-${i}`}>
                  #{channel}
                </span>
              ))}
              {channels.length > 3 && (
                <span>+{channels.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Exemplar Quotes - only shown if k is met */}
        {meetsK && exemplar_quotes && exemplar_quotes.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sample Feedback (k-anonymity protected)
            </p>
            <div className="space-y-2">
              {exemplar_quotes.slice(0, 3).map((quote, i) => (
                <blockquote 
                  key={i} 
                  className="text-sm italic text-muted-foreground border-l-2 border-emerald-600 pl-3 py-1"
                  data-testid={`theme-quote-${id}-${i}`}
                >
                  "{quote.text}"
                </blockquote>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

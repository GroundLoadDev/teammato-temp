import { Button } from "@/components/ui/button";
import { BarChart, Download, TrendingUp } from "lucide-react";

export default function Analytics() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-muted-foreground" data-testid="text-analytics-subtitle">
            Privacy-preserving insights and trends
          </p>
        </div>
        <Button className="gap-2" data-testid="button-export">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Threads", value: "127", change: "+12%" },
          { label: "Total Comments", value: "543", change: "+8%" },
          { label: "Unique Participants", value: "89", change: "+5%" },
          { label: "Avg Sentiment", value: "7.2/10", change: "+0.3" },
        ].map((metric, i) => (
          <div key={i} className="p-4 rounded-md border bg-card" data-testid={`metric-${i}`}>
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-2xl font-bold mb-1">{metric.value}</p>
            <p className="text-sm text-primary flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metric.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-md border bg-card">
          <h3 className="font-semibold mb-4">Activity by Topic</h3>
          <div className="space-y-3">
            {[
              { topic: "Product Feedback", count: 45, pct: 75 },
              { topic: "Company Culture", count: 38, pct: 63 },
              { topic: "Benefits", count: 28, pct: 47 },
              { topic: "Remote Work", count: 16, pct: 27 },
            ].map((item, i) => (
              <div key={i} data-testid={`topic-${i}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{item.topic}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-md border bg-card">
          <h3 className="font-semibold mb-4">Weekly Trend</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[40, 65, 55, 80, 70, 90, 75].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary rounded-t" 
                  style={{ height: `${height}%` }}
                  data-testid={`bar-${i}`}
                />
                <span className="text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

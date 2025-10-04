import { Activity, AlertCircle, CheckCircle, Clock, Database, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SystemHealth() {
  const uptime = 99.97;
  const avgResponseTime = 142;
  const errorRate = 0.03;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-health-title">
          System Health
        </h1>
        <p className="text-muted-foreground">Monitor platform reliability and performance</p>
      </div>

      {/* Overall Status */}
      <Card className="border-emerald-200 dark:border-emerald-900" data-testid="card-status">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">All Systems Operational</h2>
              <p className="text-muted-foreground">No incidents reported in the last 7 days</p>
            </div>
            <Badge className="ml-auto" data-testid="badge-status">Healthy</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-uptime">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{uptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-response">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Average API latency</p>
          </CardContent>
        </Card>

        <Card data-testid="card-errors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRate}%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card data-testid="card-services">
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Status of individual system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-medium">Database</h3>
                  <p className="text-sm text-muted-foreground">PostgreSQL (Neon)</p>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-600">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-medium">API Server</h3>
                  <p className="text-sm text-muted-foreground">Express.js backend</p>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-600">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <img src="https://api.slack.com/img/blocks/bkb_template_images/slack_logo.png" alt="Slack" className="w-5 h-5" />
                <div>
                  <h3 className="font-medium">Slack Integration</h3>
                  <p className="text-sm text-muted-foreground">OAuth & Events API</p>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-600">Operational</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents (placeholder) */}
      <Card data-testid="card-incidents">
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>System outages and maintenance windows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-600 mb-4" />
            <p className="font-medium mb-2">No recent incidents</p>
            <p className="text-sm text-muted-foreground">
              All systems have been running smoothly for the past 30 days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

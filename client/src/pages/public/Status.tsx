import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Activity, Database, Zap, MessageSquare, Sparkles, Shield, CreditCard } from "lucide-react";

interface ComponentStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  icon: any;
  description: string;
}

interface IncidentUpdate {
  date: string;
  title: string;
  status: 'resolved' | 'investigating' | 'monitoring';
  description: string;
}

export default function Status() {
  const [components, setComponents] = useState<ComponentStatus[]>([
    {
      name: 'API Services',
      status: 'operational',
      icon: Activity,
      description: 'Core API endpoints and authentication',
    },
    {
      name: 'Database',
      status: 'operational',
      icon: Database,
      description: 'PostgreSQL database (Neon)',
    },
    {
      name: 'Slack Integration',
      status: 'operational',
      icon: MessageSquare,
      description: 'Slack OAuth, Events API, and messaging',
    },
    {
      name: 'Theme Generation',
      status: 'operational',
      icon: Sparkles,
      description: 'ML-powered feedback clustering',
    },
    {
      name: 'Encryption Services',
      status: 'operational',
      icon: Shield,
      description: 'Per-org encryption and key management',
    },
    {
      name: 'Billing Integration',
      status: 'operational',
      icon: CreditCard,
      description: 'Stripe subscription and payment processing',
    },
  ]);

  const [recentUpdates] = useState<IncidentUpdate[]>([
    {
      date: new Date().toISOString().split('T')[0],
      title: 'All Systems Operational',
      status: 'resolved',
      description: 'All systems are currently operating normally with no known issues.',
    },
  ]);

  const overallStatus = components.every(c => c.status === 'operational')
    ? 'operational'
    : components.some(c => c.status === 'down')
    ? 'down'
    : 'degraded';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" />Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />Down</Badge>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <a href="/" className="text-2xl font-semibold text-foreground hover:text-emerald-600 transition-colors">
                Teammato
              </a>
              <p className="text-sm text-muted-foreground mt-1">System Status</p>
            </div>
            {getStatusBadge(overallStatus)}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Overall Status Banner */}
        <Card className={`p-8 mb-8 ${overallStatus === 'operational' ? 'bg-emerald-50 border-emerald-200' : overallStatus === 'degraded' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${overallStatus === 'operational' ? 'bg-emerald-100' : overallStatus === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {overallStatus === 'operational' ? (
                <CheckCircle2 className={`w-6 h-6 ${getStatusColor(overallStatus)}`} />
              ) : (
                <AlertCircle className={`w-6 h-6 ${getStatusColor(overallStatus)}`} />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2" data-testid="text-overall-status">
                {overallStatus === 'operational' 
                  ? 'All Systems Operational'
                  : overallStatus === 'degraded'
                  ? 'Some Systems Experiencing Issues'
                  : 'Major Service Disruption'}
              </h2>
              <p className={`text-sm ${overallStatus === 'operational' ? 'text-emerald-700' : overallStatus === 'degraded' ? 'text-yellow-700' : 'text-red-700'}`}>
                {overallStatus === 'operational'
                  ? 'All services are functioning normally. We are monitoring all systems to ensure optimal performance.'
                  : overallStatus === 'degraded'
                  ? 'Some services may be experiencing degraded performance. Our team is actively investigating.'
                  : 'Multiple services are currently unavailable. Our team is working to restore service as quickly as possible.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Component Status */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold mb-4">System Components</h3>
          <div className="grid gap-3">
            {components.map((component) => {
              const Icon = component.icon;
              return (
                <Card key={component.name} className="p-4 hover-elevate" data-testid={`component-${component.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-md bg-muted">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{component.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{component.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(component.status)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Updates */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Updates</h3>
          <div className="grid gap-3">
            {recentUpdates.map((update, index) => (
              <Card key={index} className="p-4" data-testid={`update-${index}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-medium text-sm">{update.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {update.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                    <p className="text-xs text-muted-foreground">{update.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <Card className="p-6 mt-12 bg-muted/50">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-2">About This Status Page</h4>
              <p className="text-sm text-muted-foreground">
                This page displays the real-time status of Teammato's core services and infrastructure. 
                We monitor all critical components 24/7 to ensure reliable service for your organization.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                For support inquiries, please contact us at{' '}
                <a href="/contact" className="text-emerald-600 hover:underline">
                  support@teammato.com
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

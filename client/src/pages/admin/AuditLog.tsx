import { useState } from "react";
import { Search, Filter, Calendar, User, FileText, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

const mockAuditLog: AuditEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: 'admin@company.com',
    action: 'feedback.moderated',
    resource: 'Thread #1234',
    details: 'Flagged inappropriate content',
    severity: 'warning',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: 'owner@company.com',
    action: 'topic.created',
    resource: 'Q1 Goals',
    details: 'Created new feedback topic',
    severity: 'info',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: 'admin@company.com',
    action: 'user.role_changed',
    resource: 'User #5678',
    details: 'Changed role from Viewer to Moderator',
    severity: 'info',
  },
];

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const filteredLog = mockAuditLog.filter(entry => {
    const matchesSearch = entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAction === 'all' || entry.action.startsWith(filterAction);
    
    // Date range filter
    let matchesDate = true;
    if (dateRange?.from) {
      const entryDate = new Date(entry.timestamp);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = entryDate >= fromDate && entryDate <= toDate;
      } else {
        matchesDate = entryDate >= fromDate;
      }
    }
    
    return matchesSearch && matchesFilter && matchesDate;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-audit-title">
          Audit Log
        </h1>
        <p className="text-muted-foreground">Track all administrative actions and system events</p>
      </div>

      {/* Filters */}
      <Card data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="topic">Topics</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={dateRange?.from ? "default" : "outline"} 
                  size="icon" 
                  data-testid="button-calendar"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  data-testid="calendar-picker"
                />
                {dateRange?.from && (
                  <div className="p-3 border-t">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {dateRange.from && format(dateRange.from, "MMM dd, yyyy")}
                        {dateRange.to && ` - ${format(dateRange.to, "MMM dd, yyyy")}`}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateRange(undefined);
                          setCalendarOpen(false);
                        }}
                        data-testid="button-clear-date"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card data-testid="card-entries">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLog.length} {filteredLog.length === 1 ? 'entry' : 'entries'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLog.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No entries match your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLog.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border hover-elevate"
                  data-testid={`entry-${entry.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{entry.action}</h3>
                        <Badge variant={getSeverityColor(entry.severity)}>
                          {entry.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.user}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {entry.resource}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

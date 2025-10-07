import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlobalFilterBar, FilterState } from "@/components/admin/GlobalFilterBar";
import { KSafetyBanner } from "@/components/admin/KSafetyBanner";
import { 
  MessageSquare, 
  Tag, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle2,
  Archive,
  Eye,
  Calendar,
  Hash
} from "lucide-react";

interface DashboardStats {
  activeTopics: number;
  upcomingTopics: number;
  expiredTopics: number;
  pendingSuggestions: number;
  releasedThreadsThisWeek: number;
  totalParticipants: number;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  slackChannelId: string | null;
  kThreshold: number;
  isActive: boolean;
  expiresAt: string | null;
  windowDays: number;
  status: string;
  ownerId: string | null;
  ownerEmail: string | null;
  actionNotes: string | null;
  createdAt: string;
  parentTopicId: string | null;
  isParent: boolean;
  instanceIdentifier: string | null;
  windowStart: string | null;
  windowEnd: string | null;
}

interface CategorizedTopics {
  created: Topic[];
  instances: Topic[];
  archived: Topic[];
}

interface FeedbackThread {
  id: string;
  title: string;
  status: string;
  participantCount: number;
  kThreshold: number;
  moderationStatus: string;
  createdAt: string;
  slackChannelId: string | null;
}

interface TopicSuggestion {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  supporterCount: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<FilterState>({
    channels: [],
    timeRange: '30',
    status: [],
    search: '',
  });

  // Fetch data
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: categorizedTopics } = useQuery<CategorizedTopics>({
    queryKey: ['/api/topics/categorized'],
  });

  const { data: allThreads } = useQuery<FeedbackThread[]>({
    queryKey: ['/api/feedback/threads'],
  });

  const { data: suggestions } = useQuery<TopicSuggestion[]>({
    queryKey: ['/api/topic-suggestions'],
  });

  // Extract unique channels from topics and threads
  const availableChannels = useMemo(() => {
    const channelMap = new Map<string, string>();
    
    categorizedTopics?.created.forEach(topic => {
      if (topic.slackChannelId) {
        channelMap.set(topic.slackChannelId, topic.slackChannelId);
      }
    });
    
    categorizedTopics?.instances.forEach(topic => {
      if (topic.slackChannelId) {
        channelMap.set(topic.slackChannelId, topic.slackChannelId);
      }
    });

    allThreads?.forEach(thread => {
      if (thread.slackChannelId) {
        channelMap.set(thread.slackChannelId, thread.slackChannelId);
      }
    });

    return Array.from(channelMap.entries()).map(([id, name]) => ({
      id,
      name: name.replace('C', '#')
    }));
  }, [categorizedTopics, allThreads]);

  // Filter topics based on active filters
  const filteredTopics = useMemo(() => {
    if (!categorizedTopics) return { active: [], upcoming: [], expired: [], archived: [] };

    const allTopics = [...(categorizedTopics.created || []), ...(categorizedTopics.instances || [])];
    const now = new Date();

    const filterTopic = (topic: Topic) => {
      // Search filter
      if (filters.search && !topic.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Channel filter
      if (filters.channels.length > 0 && !filters.channels.includes(topic.slackChannelId || '')) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(topic.status)) {
        return false;
      }

      // Time range filter
      if (filters.timeRange === 'custom') {
        if (filters.customStartDate && new Date(topic.createdAt) < new Date(filters.customStartDate)) {
          return false;
        }
        if (filters.customEndDate && new Date(topic.createdAt) > new Date(filters.customEndDate)) {
          return false;
        }
      } else if (filters.timeRange !== 'all') {
        const timeRangeDays = parseInt(filters.timeRange);
        if (!isNaN(timeRangeDays)) {
          const cutoffDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);
          if (new Date(topic.createdAt) < cutoffDate) {
            return false;
          }
        }
      }

      return true;
    };

    const active = allTopics.filter(t => 
      t.isActive && 
      t.status === 'collecting' && 
      filterTopic(t)
    );

    const upcoming = allTopics.filter(t => 
      t.isActive && 
      t.status === 'collecting' && 
      t.windowStart && 
      new Date(t.windowStart) > now &&
      filterTopic(t)
    );

    const expired = allTopics.filter(t => 
      !t.isActive && 
      (t.status === 'in_review' || t.status === 'action_decided') &&
      filterTopic(t)
    );

    const archived = (categorizedTopics.archived || []).filter(filterTopic);

    return { active, upcoming, expired, archived };
  }, [categorizedTopics, filters]);

  // Filter threads (k-safe only)
  const kSafeThreads = useMemo(() => {
    if (!allThreads) return [];

    return allThreads.filter(thread => {
      // K-safety check
      if (thread.participantCount < thread.kThreshold) {
        return false;
      }

      // Search filter
      if (filters.search && !thread.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Channel filter
      if (filters.channels.length > 0 && !filters.channels.includes(thread.slackChannelId || '')) {
        return false;
      }

      // Time range filter
      if (filters.timeRange === 'custom') {
        if (filters.customStartDate && new Date(thread.createdAt) < new Date(filters.customStartDate)) {
          return false;
        }
        if (filters.customEndDate && new Date(thread.createdAt) > new Date(filters.customEndDate)) {
          return false;
        }
      } else if (filters.timeRange !== 'all') {
        const timeRangeDays = parseInt(filters.timeRange);
        if (!isNaN(timeRangeDays)) {
          const cutoffDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);
          if (new Date(thread.createdAt) < cutoffDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [allThreads, filters]);

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return { pending: [], approved: [], rejected: [] };

    const filterSuggestion = (suggestion: TopicSuggestion) => {
      if (filters.search && !suggestion.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(suggestion.status)) {
        return false;
      }

      // Time range filter
      if (filters.timeRange === 'custom') {
        if (filters.customStartDate && new Date(suggestion.createdAt) < new Date(filters.customStartDate)) {
          return false;
        }
        if (filters.customEndDate && new Date(suggestion.createdAt) > new Date(filters.customEndDate)) {
          return false;
        }
      } else if (filters.timeRange !== 'all') {
        const timeRangeDays = parseInt(filters.timeRange);
        if (!isNaN(timeRangeDays)) {
          const cutoffDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);
          if (new Date(suggestion.createdAt) < cutoffDate) {
            return false;
          }
        }
      }

      return true;
    };

    return {
      pending: suggestions.filter(s => s.status === 'pending' && filterSuggestion(s)),
      approved: suggestions.filter(s => s.status === 'approved' && filterSuggestion(s)),
      rejected: suggestions.filter(s => s.status === 'rejected' && filterSuggestion(s)),
    };
  }, [suggestions, filters]);

  // Check if filters produce k-unsafe results
  const showKSafetyBanner = useMemo(() => {
    if (activeTab === 'feedback' && kSafeThreads.length === 0 && allThreads && allThreads.length > 0) {
      // There are threads but none are k-safe
      return true;
    }
    return false;
  }, [activeTab, kSafeThreads, allThreads]);

  return (
    <div className="flex flex-col h-full">
      <GlobalFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        availableChannels={availableChannels}
        availableStatuses={
          activeTab === 'topics' 
            ? [
                { value: 'collecting', label: 'Collecting' },
                { value: 'in_review', label: 'In Review' },
                { value: 'action_decided', label: 'Action Decided' },
                { value: 'archived', label: 'Archived' },
              ]
            : activeTab === 'suggestions'
            ? [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]
            : []
        }
        showStatusFilter={activeTab === 'topics' || activeTab === 'suggestions'}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList data-testid="admin-tabs">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="topics" data-testid="tab-topics">
                <Tag className="h-4 w-4 mr-2" />
                Topics
              </TabsTrigger>
              <TabsTrigger value="suggestions" data-testid="tab-suggestions">
                <Lightbulb className="h-4 w-4 mr-2" />
                Suggestions
              </TabsTrigger>
              <TabsTrigger value="feedback" data-testid="tab-feedback">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4" data-testid="text-overview-title">Overview</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Topics</p>
                        <p className="text-3xl font-bold mt-2" data-testid="text-active-topics-count">
                          {filteredTopics.active.length}
                        </p>
                      </div>
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Suggestions</p>
                        <p className="text-3xl font-bold mt-2" data-testid="text-pending-suggestions-count">
                          {filteredSuggestions.pending.length}
                        </p>
                      </div>
                      <Lightbulb className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Released Threads</p>
                        <p className="text-3xl font-bold mt-2" data-testid="text-released-threads-count">
                          {kSafeThreads.length}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Upcoming Topics</p>
                        <p className="text-3xl font-bold mt-2" data-testid="text-upcoming-topics-count">
                          {filteredTopics.upcoming.length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">In Review</p>
                        <p className="text-3xl font-bold mt-2" data-testid="text-expired-topics-count">
                          {filteredTopics.expired.length}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Archived</p>
                        <p className="text-3xl font-bold mt-2" data-testid="text-archived-topics-count">
                          {filteredTopics.archived.length}
                        </p>
                      </div>
                      <Archive className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Card>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('topics')}
                      data-testid="button-goto-topics"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Manage Topics
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('suggestions')}
                      data-testid="button-goto-suggestions"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Review Suggestions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('feedback')}
                      data-testid="button-goto-feedback"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Feedback
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {filteredTopics.active.length > 0 && (
                      <p data-testid="text-activity-active">
                        {filteredTopics.active.length} active {filteredTopics.active.length === 1 ? 'topic' : 'topics'} collecting feedback
                      </p>
                    )}
                    {filteredSuggestions.pending.length > 0 && (
                      <p data-testid="text-activity-pending">
                        {filteredSuggestions.pending.length} pending {filteredSuggestions.pending.length === 1 ? 'suggestion' : 'suggestions'} awaiting review
                      </p>
                    )}
                    {kSafeThreads.length > 0 && (
                      <p data-testid="text-activity-threads">
                        {kSafeThreads.length} {kSafeThreads.length === 1 ? 'thread' : 'threads'} released (k-safe)
                      </p>
                    )}
                    {filteredTopics.active.length === 0 && 
                     filteredSuggestions.pending.length === 0 && 
                     kSafeThreads.length === 0 && (
                      <p className="text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Topics Tab */}
            <TabsContent value="topics" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" data-testid="text-topics-title">Topics</h2>
                <Button onClick={() => window.location.href = '/admin/topics'} data-testid="button-manage-topics">
                  Manage Topics
                </Button>
              </div>

              <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="active" data-testid="tab-topics-active">
                    Active
                    <Badge variant="secondary" className="ml-2">{filteredTopics.active.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" data-testid="tab-topics-upcoming">
                    Upcoming
                    <Badge variant="secondary" className="ml-2">{filteredTopics.upcoming.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="expired" data-testid="tab-topics-expired">
                    In Review
                    <Badge variant="secondary" className="ml-2">{filteredTopics.expired.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="archived" data-testid="tab-topics-archived">
                    Archived
                    <Badge variant="secondary" className="ml-2">{filteredTopics.archived.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  {filteredTopics.active.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-active-topics">
                        No active topics found. Create a topic to start collecting feedback.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredTopics.active.map(topic => (
                        <Card key={topic.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold" data-testid={`text-topic-name-${topic.id}`}>
                                  {topic.name}
                                </h3>
                                <Badge variant="outline" data-testid={`badge-topic-status-${topic.id}`}>
                                  {topic.status}
                                </Badge>
                                {topic.slackChannelId && (
                                  <Badge variant="secondary" data-testid={`badge-topic-channel-${topic.id}`}>
                                    <Hash className="h-3 w-3 mr-1" />
                                    {topic.slackChannelId}
                                  </Badge>
                                )}
                              </div>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {topic.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>k-threshold: {topic.kThreshold}</span>
                                {topic.expiresAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Expires {new Date(topic.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upcoming">
                  {filteredTopics.upcoming.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-upcoming-topics">
                        No upcoming topics scheduled.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredTopics.upcoming.map(topic => (
                        <Card key={topic.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{topic.name}</h3>
                                <Badge variant="outline">Upcoming</Badge>
                              </div>
                              {topic.windowStart && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Starts {new Date(topic.windowStart).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="expired">
                  {filteredTopics.expired.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-expired-topics">
                        No topics in review.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredTopics.expired.map(topic => (
                        <Card key={topic.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{topic.name}</h3>
                                <Badge variant="outline">{topic.status}</Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="archived">
                  {filteredTopics.archived.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-archived-topics">
                        No archived topics.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredTopics.archived.map(topic => (
                        <Card key={topic.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{topic.name}</h3>
                                <Badge variant="outline">Archived</Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" data-testid="text-suggestions-title">Topic Suggestions</h2>
                <Button onClick={() => window.location.href = '/admin/topic-suggestions'} data-testid="button-manage-suggestions">
                  Manage Suggestions
                </Button>
              </div>

              <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="pending" data-testid="tab-suggestions-pending">
                    Pending
                    <Badge variant="secondary" className="ml-2">{filteredSuggestions.pending.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="approved" data-testid="tab-suggestions-approved">
                    Approved
                    <Badge variant="secondary" className="ml-2">{filteredSuggestions.approved.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="rejected" data-testid="tab-suggestions-rejected">
                    Rejected
                    <Badge variant="secondary" className="ml-2">{filteredSuggestions.rejected.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {filteredSuggestions.pending.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-pending-suggestions">
                        No pending suggestions.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredSuggestions.pending.map(suggestion => (
                        <Card key={suggestion.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold" data-testid={`text-suggestion-title-${suggestion.id}`}>
                                {suggestion.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {suggestion.supporterCount} {suggestion.supporterCount === 1 ? 'supporter' : 'supporters'}
                              </p>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="approved">
                  {filteredSuggestions.approved.length === 0 ? (
                    <Card className="p-8 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-approved-suggestions">
                        No approved suggestions.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredSuggestions.approved.map(suggestion => (
                        <Card key={suggestion.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{suggestion.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {suggestion.supporterCount} {suggestion.supporterCount === 1 ? 'supporter' : 'supporters'}
                              </p>
                            </div>
                            <Badge variant="outline">Approved</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rejected">
                  {filteredSuggestions.rejected.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground" data-testid="text-no-rejected-suggestions">
                        No rejected suggestions.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredSuggestions.rejected.map(suggestion => (
                        <Card key={suggestion.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{suggestion.title}</h3>
                            </div>
                            <Badge variant="outline">Rejected</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" data-testid="text-feedback-title">Feedback Threads</h2>
                <Button onClick={() => window.location.href = '/admin/feedback'} data-testid="button-manage-feedback">
                  Manage Feedback
                </Button>
              </div>

              {showKSafetyBanner && (
                <KSafetyBanner 
                  kThreshold={5}
                  message="No threads meet the k-anonymity threshold with your current filters. Try broader filters or wait for more participants."
                />
              )}

              {kSafeThreads.length === 0 && !showKSafetyBanner ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-feedback-threads">
                    No released feedback threads found.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {kSafeThreads.map(thread => (
                    <Card key={thread.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold" data-testid={`text-thread-title-${thread.id}`}>
                              {thread.title}
                            </h3>
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {thread.participantCount} participants
                            </Badge>
                            {thread.slackChannelId && (
                              <Badge variant="outline">
                                <Hash className="h-3 w-3 mr-1" />
                                {thread.slackChannelId}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Released {new Date(thread.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

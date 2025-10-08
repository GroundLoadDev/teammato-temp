import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Tag, Hash, Lock, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  participantCount?: number;
  suggesterEmail?: string | null;
  approvedByEmail?: string | null;
}

export default function TopicManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '',
    description: '',
    slackChannelId: '', 
    kThreshold: 5, 
    isActive: true,
    windowDays: 21,
    status: 'collecting',
    actionNotes: ''
  });
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date-desc');
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'expired' | 'archived'>('active');
  
  const { toast } = useToast();

  interface CategorizedTopics {
    created: Topic[];
    instances: Topic[];
    archived: Topic[];
  }

  const { data: categorizedTopics, isLoading } = useQuery<CategorizedTopics>({
    queryKey: ['/api/topics/categorized'],
  });

  // For validation, we need all topics
  const { data: allTopics } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string; slackChannelId?: string; kThreshold: number; windowDays: number; isActive: boolean }) => {
      return apiRequest('POST', '/api/topics', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics/categorized'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '', description: '', slackChannelId: '', kThreshold: 5, isActive: true, windowDays: 21, status: 'collecting', actionNotes: '' });
      toast({
        title: "Topic created",
        description: "The topic has been created successfully.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create topic. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Topic> }) => {
      return apiRequest('PATCH', `/api/topics/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics/categorized'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      setEditingTopic(null);
      setFormData({ name: '', slug: '', description: '', slackChannelId: '', kThreshold: 5, isActive: true, windowDays: 21, status: 'collecting', actionNotes: '' });
      toast({
        title: "Topic updated",
        description: "The topic has been updated successfully.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update topic. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/topics/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics/categorized'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Topic deleted",
        description: "The topic has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete topic. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !formData.name || !formData.slug) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate action notes when marking as actioned
    if (formData.status === 'actioned' && !formData.actionNotes?.trim()) {
      toast({
        title: "Validation error",
        description: "Action notes are required when marking a topic as actioned.",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({ id: editingTopic.id, data: formData });
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({ 
      name: topic.name, 
      slug: topic.slug,
      description: topic.description || '',
      slackChannelId: topic.slackChannelId || '', 
      kThreshold: topic.kThreshold, 
      isActive: topic.isActive,
      windowDays: topic.windowDays,
      status: topic.status,
      actionNotes: topic.actionNotes || ''
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  // Check if slug already exists (excluding current topic when editing)
  const isSlugDuplicate = (slug: string): boolean => {
    if (!allTopics || !slug) return false;
    const normalizedSlug = slug.toLowerCase().trim();
    return allTopics.some(topic => 
      topic.slug === normalizedSlug && 
      (!editingTopic || topic.id !== editingTopic.id)
    );
  };

  const isDuplicateSlug = isSlugDuplicate(formData.slug);

  // Get all topics (created + instances + archived)
  const allTopicsList = useMemo(() => {
    if (!categorizedTopics) return [];
    return [
      ...(categorizedTopics.created || []), 
      ...(categorizedTopics.instances || []),
      ...(categorizedTopics.archived || [])
    ];
  }, [categorizedTopics]);

  // Apply filters and sorting
  const filteredAndSortedTopics = useMemo(() => {
    let filtered = allTopicsList.filter(topic => {
      // Search filter
      if (searchQuery && !topic.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(topic.status)) {
        return false;
      }

      // Time range filter
      if (timeRange !== 'all') {
        const days = parseInt(timeRange);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        if (new Date(topic.createdAt) < cutoff) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allTopicsList, searchQuery, selectedStatuses, timeRange, sortBy]);

  // Categorize filtered topics by tab
  const categorizedFiltered = useMemo(() => {
    const now = new Date();
    
    const active = filteredAndSortedTopics.filter(t => 
      t.isActive && 
      t.status === 'collecting' &&
      (!t.windowStart || new Date(t.windowStart) <= now)
    );

    const upcoming = filteredAndSortedTopics.filter(t => 
      t.isActive && 
      t.status === 'collecting' && 
      t.windowStart && 
      new Date(t.windowStart) > now
    );

    const expired = filteredAndSortedTopics.filter(t => 
      !t.isActive && 
      (t.status === 'in_review' || t.status === 'action_decided')
    );

    const archived = filteredAndSortedTopics.filter(t => 
      t.status === 'archived'
    );

    return { active, upcoming, expired, archived };
  }, [filteredAndSortedTopics]);

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Helper function to render a topic card
  const renderTopicCard = (topic: Topic) => (
    <Card key={topic.id} className="p-4" data-testid={`card-topic-${topic.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 truncate" data-testid={`text-topic-name-${topic.id}`}>
            {topic.name}
          </h3>
          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded" data-testid={`text-topic-slug-${topic.id}`}>
            {topic.slug}
          </code>
          <div className="mt-1 flex flex-wrap gap-1">
            {topic.instanceIdentifier && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-instance-${topic.id}`}>
                Instance: {topic.instanceIdentifier}
              </Badge>
            )}
            {topic.suggesterEmail && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700" data-testid={`badge-suggested-${topic.id}`}>
                Suggested
              </Badge>
            )}
          </div>
        </div>
        <Badge variant={topic.isActive ? 'default' : 'secondary'} data-testid={`badge-status-${topic.id}`}>
          {topic.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      {topic.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-description-${topic.id}`}>
          {topic.description}
        </p>
      )}
      <div className="space-y-2 mb-3">
        {topic.suggesterEmail && topic.approvedByEmail ? (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="w-3 h-3" />
              <span data-testid={`text-suggester-${topic.id}`}>
                Suggested by: {topic.suggesterEmail}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="w-3 h-3" />
              <span data-testid={`text-approver-${topic.id}`}>
                Approved by: {topic.approvedByEmail}
              </span>
            </div>
          </>
        ) : topic.ownerEmail && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="w-3 h-3" />
            <span data-testid={`text-creator-${topic.id}`}>
              Created by: {topic.ownerEmail}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Tag className="w-3 h-3" />
          <span data-testid={`text-duration-${topic.id}`}>
            Duration: {topic.windowDays} days
            {topic.expiresAt && (() => {
              const now = new Date();
              const expiry = new Date(topic.expiresAt);
              const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return daysRemaining > 0 ? ` (${daysRemaining} days left)` : ' (expired)';
            })()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Tag className="w-3 h-3" />
          <span data-testid={`text-k-threshold-${topic.id}`}>
            K-Threshold: <span className={
              topic.participantCount !== undefined 
                ? topic.participantCount >= topic.kThreshold 
                  ? 'text-emerald-600' 
                  : topic.participantCount >= topic.kThreshold / 2 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                : 'text-muted-foreground'
            }>
              {topic.participantCount ?? 0}/{topic.kThreshold}
            </span>
          </span>
        </div>
        {topic.slackChannelId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="w-3 h-3" />
            <code className="bg-muted px-1 py-0.5 rounded" data-testid={`text-channel-id-${topic.id}`}>
              {topic.slackChannelId}
            </code>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(topic)}
          data-testid={`button-edit-${topic.id}`}
        >
          <Edit2 className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDelete(topic.id)}
          data-testid={`button-delete-${topic.id}`}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  );

  const totalTopicsCount = allTopicsList.length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
            Topic Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage feedback topics
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-topic">
          <Plus className="w-4 h-4 mr-2" />
          Create Topic
        </Button>
      </div>

      {!isLoading && totalTopicsCount > 0 && (
        <AdminFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          selectedStatuses={selectedStatuses}
          onStatusToggle={handleStatusToggle}
          statusOptions={[
            { value: 'collecting', label: 'Collecting' },
            { value: 'in_review', label: 'In Review' },
            { value: 'action_decided', label: 'Action Decided' },
            { value: 'actioned', label: 'Actioned' },
            { value: 'archived', label: 'Archived' },
          ]}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: 'date-desc', label: 'Newest first' },
            { value: 'date-asc', label: 'Oldest first' },
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
          ]}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading topics...</p>
      ) : !categorizedTopics || totalTopicsCount === 0 ? (
        <Card className="p-8 text-center" data-testid="card-no-topics">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No topics yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first topic to start collecting feedback
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-topic">
            <Plus className="w-4 h-4 mr-2" />
            Create Topic
          </Button>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({categorizedFiltered.active.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({categorizedFiltered.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="expired" data-testid="tab-expired">
              Expired ({categorizedFiltered.expired.length})
            </TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived">
              Archived ({categorizedFiltered.archived.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {categorizedFiltered.active.length === 0 ? (
              <Card className="p-8 text-center">
                <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active topics found</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedFiltered.active.map(renderTopicCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {categorizedFiltered.upcoming.length === 0 ? (
              <Card className="p-8 text-center">
                <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming topics found</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedFiltered.upcoming.map(renderTopicCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {categorizedFiltered.expired.length === 0 ? (
              <Card className="p-8 text-center">
                <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No expired topics found</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedFiltered.expired.map(renderTopicCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            {categorizedFiltered.archived.length === 0 ? (
              <Card className="p-8 text-center">
                <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No archived topics found</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedFiltered.archived.map(renderTopicCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create/Edit Dialog - keeping existing implementation */}
      <Dialog open={isCreateDialogOpen || !!editingTopic} onOpenChange={() => {
        setIsCreateDialogOpen(false);
        setEditingTopic(null);
        setFormData({ name: '', slug: '', description: '', slackChannelId: '', kThreshold: 5, isActive: true, windowDays: 21, status: 'collecting', actionNotes: '' });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingTopic ? handleUpdate : handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Topic Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Team Collaboration"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Topic Slug *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline w-3 h-3 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Used in /teammato [slug] command</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="e.g., team-collab"
                data-testid="input-slug"
              />
              {isDuplicateSlug && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This slug already exists. Please choose a unique slug.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What feedback should users provide?"
                rows={3}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slackChannelId">
                Slack Channel ID
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline w-3 h-3 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Optional. Where feedback will be posted.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="slackChannelId"
                value={formData.slackChannelId}
                onChange={(e) => setFormData({ ...formData, slackChannelId: e.target.value })}
                placeholder="e.g., C01234567"
                data-testid="input-channel-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kThreshold">
                K-Anonymity Threshold: {formData.kThreshold}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline w-3 h-3 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{editingTopic ? 'Cannot be changed after creation for privacy and anonymity protection' : 'Minimum participants before feedback is visible (minimum 5)'}</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id="kThreshold"
                min={5}
                max={10}
                step={1}
                value={[formData.kThreshold]}
                onValueChange={(value) => setFormData({ ...formData, kThreshold: value[0] })}
                disabled={!!editingTopic}
                data-testid="slider-k-threshold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="windowDays">
                Collection Window (days): {formData.windowDays}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline w-3 h-3 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{editingTopic ? 'Cannot be changed after creation for privacy and anonymity protection' : 'Number of days to collect feedback'}</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id="windowDays"
                min={7}
                max={90}
                step={1}
                value={[formData.windowDays]}
                onValueChange={(value) => setFormData({ ...formData, windowDays: value[0] })}
                disabled={!!editingTopic}
                data-testid="slider-window-days"
              />
            </div>

            {editingTopic && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collecting">Collecting</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="action_decided">Action Decided</SelectItem>
                    <SelectItem value="actioned">Actioned</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingTopic && formData.status === 'actioned' && (
              <div className="space-y-2">
                <Label htmlFor="actionNotes">Action Notes *</Label>
                <Textarea
                  id="actionNotes"
                  value={formData.actionNotes}
                  onChange={(e) => setFormData({ ...formData, actionNotes: e.target.value })}
                  placeholder="Describe what actions were taken..."
                  rows={3}
                  data-testid="input-action-notes"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingTopic(null);
                  setFormData({ name: '', slug: '', description: '', slackChannelId: '', kThreshold: 5, isActive: true, windowDays: 21, status: 'collecting', actionNotes: '' });
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || isDuplicateSlug}
                data-testid="button-save"
              >
                {editingTopic ? 'Update Topic' : 'Create Topic'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

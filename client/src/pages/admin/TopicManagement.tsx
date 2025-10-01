import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Tag, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Topic {
  id: string;
  name: string;
  slug: string;
  slackChannelId: string | null;
  kThreshold: number;
  isActive: boolean;
}

export default function TopicManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '', 
    slackChannelId: '', 
    kThreshold: 5, 
    isActive: true 
  });
  const { toast } = useToast();

  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; isActive: boolean }) => {
      return apiRequest('POST', '/api/topics', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '', slackChannelId: '', kThreshold: 5, isActive: true });
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
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      setEditingTopic(null);
      setFormData({ name: '', slug: '', slackChannelId: '', kThreshold: 5, isActive: true });
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
    updateMutation.mutate({ id: editingTopic.id, data: formData });
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({ 
      name: topic.name, 
      slug: topic.slug, 
      slackChannelId: topic.slackChannelId || '', 
      kThreshold: topic.kThreshold, 
      isActive: topic.isActive 
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
    if (!topics || !slug) return false;
    const normalizedSlug = slug.toLowerCase().trim();
    return topics.some(topic => 
      topic.slug === normalizedSlug && 
      (!editingTopic || topic.id !== editingTopic.id)
    );
  };

  const isDuplicateSlug = isSlugDuplicate(formData.slug);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
            Topic Management
          </h1>
          <p className="text-muted-foreground">
            Manage feedback topics and categories
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-topic"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Topic
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading topics...</p>
      ) : !topics || topics.length === 0 ? (
        <Card className="p-8 text-center" data-testid="card-no-topics">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No topics yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create topics to organize feedback submissions
          </p>
          <Button
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-first-topic"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Topic
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Card key={topic.id} className="p-4" data-testid={`card-topic-${topic.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate" data-testid={`text-topic-name-${topic.id}`}>
                    {topic.name}
                  </h3>
                  <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded" data-testid={`text-topic-slug-${topic.id}`}>
                    {topic.slug}
                  </code>
                </div>
                <Badge variant={topic.isActive ? 'default' : 'secondary'} data-testid={`badge-status-${topic.id}`}>
                  {topic.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span data-testid={`text-k-threshold-${topic.id}`}>
                    K-Threshold: {topic.kThreshold}
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
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(topic.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${topic.id}`}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Topic Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Product Feedback"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., product-feedback"
                data-testid="input-slug"
                className={isDuplicateSlug ? "border-destructive" : ""}
              />
              {isDuplicateSlug ? (
                <p className="text-xs text-destructive" data-testid="text-duplicate-error">
                  This topic slug already exists. Please choose a different name.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Auto-generated from name, can be customized
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slackChannelId">Slack Channel ID (optional)</Label>
              <Input
                id="slackChannelId"
                value={formData.slackChannelId}
                onChange={(e) => setFormData({ ...formData, slackChannelId: e.target.value })}
                placeholder="e.g., C1234567890"
                data-testid="input-channel-id"
              />
              <p className="text-xs text-muted-foreground">
                Channel where feedback will be posted
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kThreshold">K-Anonymity Threshold</Label>
              <Input
                id="kThreshold"
                type="number"
                min="1"
                max="100"
                value={formData.kThreshold}
                onChange={(e) => setFormData({ ...formData, kThreshold: parseInt(e.target.value) || 5 })}
                data-testid="input-k-threshold"
              />
              <p className="text-xs text-muted-foreground">
                Minimum participants required before revealing feedback
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-active"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || isDuplicateSlug}
                data-testid="button-submit"
              >
                Create Topic
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Topic Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Product Feedback"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., product-feedback"
                data-testid="input-edit-slug"
                className={isDuplicateSlug ? "border-destructive" : ""}
              />
              {isDuplicateSlug ? (
                <p className="text-xs text-destructive" data-testid="text-edit-duplicate-error">
                  This topic slug already exists. Please choose a different slug.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier for this topic
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slackChannelId">Slack Channel ID (optional)</Label>
              <Input
                id="edit-slackChannelId"
                value={formData.slackChannelId}
                onChange={(e) => setFormData({ ...formData, slackChannelId: e.target.value })}
                placeholder="e.g., C1234567890"
                data-testid="input-edit-channel-id"
              />
              <p className="text-xs text-muted-foreground">
                Channel where feedback will be posted
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-kThreshold">K-Anonymity Threshold</Label>
              <Input
                id="edit-kThreshold"
                type="number"
                min="1"
                max="100"
                value={formData.kThreshold}
                onChange={(e) => setFormData({ ...formData, kThreshold: parseInt(e.target.value) || 5 })}
                data-testid="input-edit-k-threshold"
              />
              <p className="text-xs text-muted-foreground">
                Minimum participants required before revealing feedback
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-edit-active"
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTopic(null)}
                data-testid="button-edit-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending || isDuplicateSlug}
                data-testid="button-edit-submit"
              >
                Update Topic
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

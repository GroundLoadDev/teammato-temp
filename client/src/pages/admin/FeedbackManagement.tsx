import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Eye, EyeOff, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeedbackThread {
  id: string;
  title: string;
  status: string;
  participantCount: number;
  kThreshold: number;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  moderatedAt?: string;
}

interface ThreadWithItems extends FeedbackThread {
  items: FeedbackItem[];
}

export default function FeedbackManagement() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: threads, isLoading: threadsLoading } = useQuery<FeedbackThread[]>({
    queryKey: ['/api/feedback/threads'],
  });

  const { data: threadDetails, isLoading: detailsLoading } = useQuery<ThreadWithItems>({
    queryKey: ['/api/feedback/threads', selectedThreadId],
    enabled: !!selectedThreadId,
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      return apiRequest('POST', `/api/feedback/items/${itemId}/moderate`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/threads', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/threads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Item moderated",
        description: "The feedback item has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to moderate item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleModerate = (itemId: string, status: string) => {
    moderateMutation.mutate({ itemId, status });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ready': return 'default';
      case 'approved': return 'default';
      case 'hidden': return 'secondary';
      case 'removed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
          Feedback Management
        </h1>
        <p className="text-muted-foreground">
          View and moderate feedback submissions
        </p>
      </div>

      {threadsLoading ? (
        <p className="text-muted-foreground">Loading threads...</p>
      ) : !threads || threads.length === 0 ? (
        <Card className="p-8 text-center" data-testid="card-no-threads">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No feedback threads yet</p>
          <p className="text-sm text-muted-foreground">
            Feedback threads will appear here once users submit via Slack
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {threads.map((thread) => (
            <Card 
              key={thread.id} 
              className="p-4 hover-elevate cursor-pointer" 
              onClick={() => setSelectedThreadId(thread.id)}
              data-testid={`card-thread-${thread.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate" data-testid={`text-thread-title-${thread.id}`}>
                      {thread.title}
                    </h3>
                    <Badge variant={getStatusVariant(thread.status)} data-testid={`badge-status-${thread.id}`}>
                      {thread.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span data-testid={`text-participants-${thread.id}`}>
                      {thread.participantCount} / {thread.kThreshold} participants
                    </span>
                    <span>
                      {thread.status === 'ready' ? 'Ready for review' : 'Collecting feedback'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" data-testid={`button-view-${thread.id}`}>
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Thread Details Dialog */}
      <Dialog open={!!selectedThreadId} onOpenChange={() => setSelectedThreadId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thread Details</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : threadDetails ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1" data-testid="text-detail-title">
                    {threadDetails.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span data-testid="text-detail-participants">
                      {threadDetails.participantCount} participants
                    </span>
                    <span>K-threshold: {threadDetails.kThreshold}</span>
                  </div>
                </div>
                <Badge variant={getStatusVariant(threadDetails.status)} data-testid="badge-detail-status">
                  {threadDetails.status}
                </Badge>
              </div>

              {threadDetails.status !== 'ready' && (
                <Card className="p-4 bg-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong>K-anonymity Protection Active:</strong> This thread needs {threadDetails.kThreshold - threadDetails.participantCount} more participant(s) before feedback becomes visible.
                  </p>
                </Card>
              )}

              <div className="space-y-4">
                <h4 className="font-semibold">Feedback Items ({threadDetails.items.length})</h4>
                {threadDetails.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No feedback items yet</p>
                ) : (
                  threadDetails.items.map((item, idx) => (
                    <Card key={item.id} className="p-4" data-testid={`card-item-${item.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusVariant(item.status)} data-testid={`badge-item-status-${item.id}`}>
                              {item.status}
                            </Badge>
                            {item.moderatedAt && (
                              <span className="text-xs text-muted-foreground">
                                Moderated {new Date(item.moderatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-2" data-testid={`text-item-content-${item.id}`}>
                            {item.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModerate(item.id, 'approved')}
                                disabled={moderateMutation.isPending}
                                data-testid={`button-approve-${item.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModerate(item.id, 'hidden')}
                                disabled={moderateMutation.isPending}
                                data-testid={`button-hide-${item.id}`}
                              >
                                <EyeOff className="w-4 h-4 mr-1" />
                                Hide
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleModerate(item.id, 'removed')}
                                disabled={moderateMutation.isPending}
                                data-testid={`button-remove-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </>
                          )}
                          {item.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModerate(item.id, 'pending')}
                              disabled={moderateMutation.isPending}
                              data-testid={`button-reset-${item.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Reset to Pending
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

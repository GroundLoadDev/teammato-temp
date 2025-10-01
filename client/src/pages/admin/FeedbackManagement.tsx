import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Eye, EyeOff, Flag, Archive, CheckCircle2, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackThread {
  id: string;
  title: string;
  status: string;
  participantCount: number;
  kThreshold: number;
  moderationStatus: string;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  content: string;
  status: string;
  moderationStatus: string;
  moderationNotes?: string;
  moderatedAt?: string;
  createdAt: string;
}

interface ThreadWithItems extends FeedbackThread {
  items: FeedbackItem[];
}

interface ModerationAuditEntry {
  id: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  createdAt: string;
}

export default function FeedbackManagement() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedModerationStatus, setSelectedModerationStatus] = useState<string>('');
  const [moderationReason, setModerationReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  const { data: threads, isLoading: threadsLoading } = useQuery<FeedbackThread[]>({
    queryKey: ['/api/feedback/threads'],
  });

  const { data: threadDetails, isLoading: detailsLoading } = useQuery<ThreadWithItems>({
    queryKey: [`/api/feedback/threads/${selectedThreadId}`, selectedThreadId],
    enabled: !!selectedThreadId,
  });

  const { data: auditTrail } = useQuery<ModerationAuditEntry[]>({
    queryKey: [`/api/moderation/audit/thread/${selectedThreadId}`, 'thread', selectedThreadId],
    enabled: !!selectedThreadId && auditDialogOpen,
  });

  const moderateThreadMutation = useMutation({
    mutationFn: async ({ threadId, moderationStatus, notes, reason }: { 
      threadId: string; 
      moderationStatus: string; 
      notes?: string;
      reason?: string;
    }) => {
      return apiRequest('POST', `/api/moderation/threads/${threadId}`, { 
        moderationStatus, 
        notes,
        reason 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/feedback/threads/${selectedThreadId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/threads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setModerationDialogOpen(false);
      setNotesDialogOpen(false);
      setModerationReason('');
      setAdminNotes('');
      toast({
        title: "Thread moderated",
        description: "The thread status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to moderate thread. Please try again.",
        variant: "destructive",
      });
    },
  });

  const moderateItemMutation = useMutation({
    mutationFn: async ({ itemId, moderationStatus, reason }: { 
      itemId: string; 
      moderationStatus: string;
      reason?: string;
    }) => {
      return apiRequest('POST', `/api/moderation/items/${itemId}`, { moderationStatus, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/feedback/threads/${selectedThreadId}`] });
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

  const handleModerateThread = (status: string) => {
    if (!selectedThreadId) return;
    setSelectedModerationStatus(status);
    setModerationDialogOpen(true);
  };

  const handleAddNotes = () => {
    if (!threadDetails) return;
    setAdminNotes(threadDetails.moderationNotes || '');
    setNotesDialogOpen(true);
  };

  const confirmModeration = () => {
    if (!selectedThreadId) return;
    moderateThreadMutation.mutate({
      threadId: selectedThreadId,
      moderationStatus: selectedModerationStatus,
      reason: moderationReason,
    });
  };

  const saveNotes = () => {
    if (!selectedThreadId || !threadDetails) return;
    moderateThreadMutation.mutate({
      threadId: selectedThreadId,
      moderationStatus: threadDetails.moderationStatus,
      notes: adminNotes,
    });
  };

  const handleModerateItem = (itemId: string, moderationStatus: string) => {
    moderateItemMutation.mutate({ itemId, moderationStatus });
  };

  const getModerationStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'auto_approved': return 'default';
      case 'pending_review': return 'outline';
      case 'flagged': return 'destructive';
      case 'hidden': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
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
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold truncate" data-testid={`text-thread-title-${thread.id}`}>
                      {thread.title}
                    </h3>
                    <Badge variant={getStatusVariant(thread.status)} data-testid={`badge-status-${thread.id}`}>
                      {thread.status}
                    </Badge>
                    <Badge variant={getModerationStatusVariant(thread.moderationStatus)} data-testid={`badge-moderation-${thread.id}`}>
                      {thread.moderationStatus}
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-detail-title">
                    {threadDetails.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span data-testid="text-detail-participants">
                      {threadDetails.participantCount} participants
                    </span>
                    <span>K-threshold: {threadDetails.kThreshold}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusVariant(threadDetails.status)} data-testid="badge-detail-status">
                      {threadDetails.status}
                    </Badge>
                    <Badge variant={getModerationStatusVariant(threadDetails.moderationStatus)} data-testid="badge-detail-moderation">
                      {threadDetails.moderationStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerateThread('approved')}
                      disabled={moderateThreadMutation.isPending}
                      data-testid="button-approve-thread"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerateThread('flagged')}
                      disabled={moderateThreadMutation.isPending}
                      data-testid="button-flag-thread"
                    >
                      <Flag className="w-4 h-4 mr-1" />
                      Flag
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerateThread('hidden')}
                      disabled={moderateThreadMutation.isPending}
                      data-testid="button-hide-thread"
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerateThread('archived')}
                      disabled={moderateThreadMutation.isPending}
                      data-testid="button-archive-thread"
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Archive
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddNotes}
                      data-testid="button-add-notes"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAuditDialogOpen(true)}
                      data-testid="button-view-audit"
                    >
                      <History className="w-4 h-4 mr-1" />
                      History
                    </Button>
                  </div>
                </div>
              </div>

              {threadDetails.moderationNotes && (
                <Card className="p-4 bg-muted">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1">Admin Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{threadDetails.moderationNotes}</p>
                    </div>
                  </div>
                </Card>
              )}

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
                  threadDetails.items.map((item) => (
                    <Card key={item.id} className="p-4" data-testid={`card-item-${item.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant={getStatusVariant(item.status)} data-testid={`badge-item-status-${item.id}`}>
                              {item.status}
                            </Badge>
                            <Badge variant={getModerationStatusVariant(item.moderationStatus)} data-testid={`badge-item-moderation-${item.id}`}>
                              {item.moderationStatus}
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
                          {item.moderationNotes && (
                            <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded">
                              <FileText className="w-3 h-3 mt-0.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{item.moderationNotes}</p>
                            </div>
                          )}
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
                                onClick={() => handleModerateItem(item.id, 'approved')}
                                disabled={moderateItemMutation.isPending}
                                data-testid={`button-approve-item-${item.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModerateItem(item.id, 'hidden')}
                                disabled={moderateItemMutation.isPending}
                                data-testid={`button-hide-item-${item.id}`}
                              >
                                <EyeOff className="w-4 h-4 mr-1" />
                                Hide
                              </Button>
                            </>
                          )}
                          {item.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModerateItem(item.id, 'pending')}
                              disabled={moderateItemMutation.isPending}
                              data-testid={`button-reset-item-${item.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Reset
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

      {/* Moderation Confirmation Dialog */}
      <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Moderation Action</DialogTitle>
            <DialogDescription>
              You are about to change this thread's status to <strong>{selectedModerationStatus}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why are you taking this action?"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={3}
                data-testid="textarea-moderation-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerationDialogOpen(false)} data-testid="button-cancel-moderation">
              Cancel
            </Button>
            <Button onClick={confirmModeration} disabled={moderateThreadMutation.isPending} data-testid="button-confirm-moderation">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add internal notes about this thread (not visible to users).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes about this thread..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
                data-testid="textarea-admin-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)} data-testid="button-cancel-notes">
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={moderateThreadMutation.isPending} data-testid="button-save-notes">
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderation History</DialogTitle>
            <DialogDescription>
              View all moderation actions taken on this thread.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditTrail && auditTrail.length > 0 ? (
              auditTrail.map((entry) => (
                <Card key={entry.id} className="p-3" data-testid={`card-audit-${entry.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" data-testid={`badge-audit-action-${entry.id}`}>{entry.action}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Changed from <strong>{entry.previousStatus}</strong> to <strong>{entry.newStatus}</strong>
                      </p>
                      {entry.reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{entry.reason}"</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No moderation history yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

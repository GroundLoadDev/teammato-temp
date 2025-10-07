import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Lightbulb, MessageSquare, Command, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TopicSuggestion {
  id: string;
  title: string;
  status: string;
  suggestedBy: string;
  suggesterEmail: string | null;
  supporterCount: number;
  createdAt: string;
}

export default function TopicSuggestions() {
  const { toast } = useToast();

  const { data: suggestions, isLoading } = useQuery<TopicSuggestion[]>({
    queryKey: ['/api/topic-suggestions'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/topic-suggestions/${id}`, { status });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/topic-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topics/categorized'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      
      toast({
        title: variables.status === 'approved' ? 'Suggestion approved' : 'Suggestion rejected',
        description: variables.status === 'approved' 
          ? 'A new topic has been created from this suggestion.'
          : 'The suggestion has been rejected.',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to update suggestion. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    if (confirm('Are you sure you want to reject this topic suggestion?')) {
      updateMutation.mutate({ id, status: 'rejected' });
    }
  };

  const pendingSuggestions = suggestions?.filter(s => s.status === 'pending') || [];
  const reviewedSuggestions = suggestions?.filter(s => s.status !== 'pending') || [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
            Topic Suggestions
          </h1>
          <p className="text-muted-foreground">
            Review and approve topic suggestions from your team
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading suggestions...</p>
      ) : !suggestions || suggestions.length === 0 ? (
        <div className="space-y-4">
          <Card className="p-8 text-center" data-testid="card-no-suggestions">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No topic suggestions yet</h3>
            <p className="text-muted-foreground mb-4">
              Team members can suggest new feedback topics directly from Slack
            </p>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Command className="w-5 h-5 text-primary" />
                How to Suggest Topics via Slack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">Suggest a Topic</p>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      /teammato suggest "Your Topic Name"
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Submits a new topic suggestion for admin review
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">View Available Commands</p>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      /teammato help
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Shows all available Teammato commands
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">Submit Feedback</p>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      /teammato [topic-slug]
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Opens a form to submit anonymous feedback for a topic
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground border-t pt-3">
                <strong>Note:</strong> Suggestions appear here for admin approval. Once approved, they become active topics for feedback collection.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Suggestions */}
          {pendingSuggestions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-pending-heading">
                Pending Suggestions ({pendingSuggestions.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4" data-testid={`card-suggestion-${suggestion.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1" data-testid={`text-title-${suggestion.id}`}>
                          {suggestion.title}
                        </h3>
                        {suggestion.suggesterEmail && (
                          <p className="text-xs text-muted-foreground" data-testid={`text-suggester-${suggestion.id}`}>
                            Suggested by: {suggestion.suggesterEmail}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground" data-testid={`text-date-${suggestion.id}`}>
                            {new Date(suggestion.createdAt).toLocaleDateString()}
                          </p>
                          {suggestion.supporterCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-supporters-${suggestion.id}`}>
                              <Users className="w-3 h-3" />
                              <span>{suggestion.supporterCount} {suggestion.supporterCount === 1 ? 'supporter' : 'supporters'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`badge-status-${suggestion.id}`}>
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(suggestion.id)}
                        disabled={updateMutation.isPending}
                        data-testid={`button-approve-${suggestion.id}`}
                        className="flex-1"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(suggestion.id)}
                        disabled={updateMutation.isPending}
                        data-testid={`button-reject-${suggestion.id}`}
                        className="flex-1"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reviewed Suggestions */}
          {reviewedSuggestions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-reviewed-heading">
                Reviewed Suggestions
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviewedSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4" data-testid={`card-suggestion-${suggestion.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1" data-testid={`text-title-${suggestion.id}`}>
                          {suggestion.title}
                        </h3>
                        {suggestion.suggesterEmail && (
                          <p className="text-xs text-muted-foreground" data-testid={`text-suggester-${suggestion.id}`}>
                            Suggested by: {suggestion.suggesterEmail}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground" data-testid={`text-date-${suggestion.id}`}>
                            {new Date(suggestion.createdAt).toLocaleDateString()}
                          </p>
                          {suggestion.supporterCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-supporters-${suggestion.id}`}>
                              <Users className="w-3 h-3" />
                              <span>{suggestion.supporterCount} {suggestion.supporterCount === 1 ? 'supporter' : 'supporters'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={suggestion.status === 'approved' ? 'default' : 'secondary'} 
                        data-testid={`badge-status-${suggestion.id}`}
                      >
                        {suggestion.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

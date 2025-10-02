import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TopicSuggestion {
  id: string;
  title: string;
  status: string;
  suggestedBy: string;
  suggesterEmail: string | null;
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
        <Card className="p-8 text-center" data-testid="card-no-suggestions">
          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No topic suggestions yet</p>
          <p className="text-sm text-muted-foreground">
            Team members can suggest topics using the /teammato command in Slack
          </p>
        </Card>
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
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`text-date-${suggestion.id}`}>
                          {new Date(suggestion.createdAt).toLocaleDateString()}
                        </p>
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
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`text-date-${suggestion.id}`}>
                          {new Date(suggestion.createdAt).toLocaleDateString()}
                        </p>
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

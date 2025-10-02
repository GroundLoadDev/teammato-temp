import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Edit, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string | null;
  role: string;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  slackHandle: string;
  email: string | null;
  role: string;
  inviterEmail: string | null;
  expiresAt: string;
  createdAt: string;
}

interface UsersData {
  users: User[];
  pendingInvitations: PendingInvitation[];
}

export default function UserManagement() {
  const { toast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [slackHandle, setSlackHandle] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("admin");
  const [newRole, setNewRole] = useState<string>("");

  const { data, isLoading } = useQuery<UsersData>({
    queryKey: ['/api/users'],
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { slackHandle: string; role: string }) =>
      apiRequest('/api/invitations', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setInviteModalOpen(false);
      setSlackHandle("");
      setInviteRole("admin");
      toast({
        title: "Invitation sent",
        description: "The user will receive a DM with an invitation to join.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) =>
      apiRequest(`/api/users/${data.userId}/role`, 'PATCH', { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setChangeRoleModalOpen(false);
      setSelectedUser(null);
      toast({
        title: "Role updated",
        description: "User role has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) =>
      apiRequest(`/api/users/${userId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User removed",
        description: "User has been removed from the organization.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove user",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({ slackHandle, role: inviteRole });
  };

  const handleChangeRole = () => {
    if (selectedUser && newRole) {
      changeRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user? This action cannot be undone.")) {
      deleteMutation.mutate(userId);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'moderator':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-users-title">
            User Management
          </h1>
          <p className="text-muted-foreground" data-testid="text-users-subtitle">
            Manage team members and permissions
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setInviteModalOpen(true)}
          data-testid="button-invite-user"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Users */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Active Users ({data?.users.length || 0})</h3>
            {data?.users && data.users.length > 0 ? (
              <div className="space-y-3">
                {data.users.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`user-${index}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-email-${index}`}>
                        {user.email || 'No email'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleBadgeVariant(user.role)} data-testid={`badge-role-${index}`}>
                        {user.role}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setChangeRoleModalOpen(true);
                          }}
                          data-testid={`button-change-role-${index}`}
                        >
                          <Edit className="w-3 h-3" />
                          Change Role
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id)}
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No users yet</p>
                <p className="text-sm mt-1">Invite your first team member to get started</p>
              </div>
            )}
          </Card>

          {/* Pending Invitations */}
          {data?.pendingInvitations && data.pendingInvitations.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Invitations ({data.pendingInvitations.length})
              </h3>
              <div className="space-y-3">
                {data.pendingInvitations.map((invitation, index) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-md border border-dashed"
                    data-testid={`invitation-${index}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-invitation-handle-${index}`}>
                        @{invitation.slackHandle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.inviterEmail || 'Unknown'} • Expires {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(invitation.role)} data-testid={`badge-invitation-role-${index}`}>
                      {invitation.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Invite User Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent data-testid="modal-invite-user">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Invite a teammate from your Slack workspace. They'll receive a DM with an invitation link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="slack-handle">Slack Handle</Label>
                <Input
                  id="slack-handle"
                  placeholder="username (without @)"
                  value={slackHandle}
                  onChange={(e) => setSlackHandle(e.target.value)}
                  required
                  data-testid="input-slack-handle"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the Slack username without the @ symbol
                </p>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole} required>
                  <SelectTrigger id="role" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose the appropriate permission level for this user
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteModalOpen(false)}
                data-testid="button-cancel-invite"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                data-testid="button-send-invite"
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={changeRoleModalOpen} onOpenChange={setChangeRoleModalOpen}>
        <DialogContent data-testid="modal-change-role">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.email || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole} required>
                <SelectTrigger id="new-role" data-testid="select-new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setChangeRoleModalOpen(false)}
              data-testid="button-cancel-role"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={changeRoleMutation.isPending}
              data-testid="button-confirm-role"
            >
              {changeRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

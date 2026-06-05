"use client";

import { useState, useEffect } from "react";
import { IProjectMember, IUser, IProjectSummary } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import {
  addProjectMember,
  removeProjectMember,
} from "@/services/project/projectManagement";
import { getAllUsers } from "@/services/admin/userManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";

const roleWeight: Record<string, number> = {
  ADMIN: 1,
  PROJECT_MANAGER: 2,
  TEAM_MEMBER: 3,
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_MEMBER: "Team Member",
};

const roleStyles: Record<
  string,
  { cardBorder: string; badge: string; avatarBg: string }
> = {
  ADMIN: {
    cardBorder: "border-l-[4px] border-l-rose-500/80 dark:border-l-rose-500",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-none",
    avatarBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  PROJECT_MANAGER: {
    cardBorder: "border-l-[4px] border-l-amber-500/80 dark:border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 shadow-none",
    avatarBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  TEAM_MEMBER: {
    cardBorder: "border-l-[4px] border-l-emerald-500/80 dark:border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-none",
    avatarBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

interface ProjectMemberManagerProps {
  projectId: string;
  members: IProjectMember[];
  createdById: string;
  userRole: UserRole;
  onMembersChanged: () => void;
  workload?: IProjectSummary["memberWorkload"];
  onAddTaskClick?: (userId: string) => void;
}

export default function ProjectMemberManager({
  projectId,
  members,
  createdById,
  userRole,
  onMembersChanged,
  workload = [],
  onAddTaskClick,
}: ProjectMemberManagerProps) {
  const canManageMembers =
    userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const memberUserIds = new Set(members.map((m) => m.userId));

  console.log("searchResults", searchResults);

  const handleSearchUsers = async () => {
    setSearching(true);
    try {
      const res = await getAllUsers({
        searchTerm: searchTerm.trim() || undefined,
        limit: 100,
      });
      if (res.success) {
        console.log("success");
        setSearchResults(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (addDialogOpen) {
      handleSearchUsers();
    }
  }, [addDialogOpen]);

  const handleAddMember = async (userId: string) => {
    setAddingId(userId);
    try {
      const res = await addProjectMember(projectId, userId);
      if (res.success) {
        toast.success(res.message || "Member added!");
        onMembersChanged();
      } else {
        toast.error(res.message || "Failed to add member");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add member");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    try {
      const res = await removeProjectMember(projectId, userId);
      if (res.success) {
        toast.success(res.message || "Member removed!");
        onMembersChanged();
      } else {
        toast.error(res.message || "Failed to remove member");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-bold text-foreground">
            Team Members ({members.length})
          </h3>
        </div>
        {canManageMembers && (
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {(() => {
          const sortedMembers = [...members].sort((a, b) => {
            const wA = roleWeight[a.user.role] || 99;
            const wB = roleWeight[b.user.role] || 99;
            if (wA !== wB) return wA - wB;
            return a.user.name.localeCompare(b.user.name);
          });
          return sortedMembers.map((member) => {
            const isCreator = member.userId === createdById;
            const style = roleStyles[member.user.role] || {
              cardBorder: "border-l-[4px] border-l-primary/60",
              badge: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 shadow-none",
              avatarBg: "bg-primary/10 text-primary",
            };
            const label = roleLabels[member.user.role] || member.user.role.replace("_", " ");
            const userWorkload = workload.find((w) => w.user.id === member.userId) || {
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
            };

            return (
              <div
                key={member.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/70 dark:border-slate-800/80 p-4 bg-card/65 dark:bg-slate-900/50 backdrop-blur-md shadow-sm gap-4 ${style.cardBorder}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold ${style.avatarBg}`}>
                    <span className="text-sm font-bold">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground leading-none">
                        {member.user.name}
                      </p>
                      {isCreator && (
                        <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold rounded-full px-2.5 py-0.5 border border-violet-500/20 hover:bg-violet-500/20 shadow-none">
                          Creator
                        </Badge>
                      )}
                      <Badge className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 border ${style.badge}`}>
                        {label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                  {/* Task stats pills */}
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="text-sm font-extrabold text-foreground">{userWorkload.totalTasks}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
                    </div>
                    <div className="h-6 w-px bg-border/60" />
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{userWorkload.completedTasks}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Done</span>
                    </div>
                    <div className="h-6 w-px bg-border/60" />
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="text-sm font-extrabold text-amber-500">{userWorkload.pendingTasks}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</span>
                    </div>
                  </div>

                  {/* Add Task Button */}
                  {canManageMembers && onAddTaskClick && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer shrink-0 text-xs font-bold"
                      onClick={() => onAddTaskClick(member.userId)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Task
                    </Button>
                  )}

                  {canManageMembers && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-600 transition-colors shrink-0"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={removingId === member.userId}
                    >
                      {removingId === member.userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card/95 dark:bg-slate-900/95 backdrop-blur-lg border border-border/80 dark:border-slate-800/90 rounded-2xl shadow-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Team Member
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 bg-muted/30 dark:bg-slate-950/20 border-border/80 rounded-xl py-5 "
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                />
              </div>
              <Button
                onClick={handleSearchUsers}
                disabled={searching}
                size="lg"
                className="rounded-xl px-4 cursor-pointer"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (() => {
                const nonMembers = searchResults.filter((user) => !memberUserIds.has(user.id));
                if (nonMembers.length === 0) {
                  return (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {searchResults.length > 0 ? "All searched users are already members" : "No users found"}
                    </p>
                  );
                }
                return nonMembers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 dark:bg-slate-950/20 p-3.5 transition-all hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddMember(user.id)}
                      disabled={addingId === user.id}
                      className="gap-1 rounded-lg border-border hover:bg-primary hover:text-white"
                    >
                      {addingId === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add
                    </Button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

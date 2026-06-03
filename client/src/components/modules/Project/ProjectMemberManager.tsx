"use client";

import { useState } from "react";
import { IProjectMember, IUser } from "@/types";
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

interface ProjectMemberManagerProps {
  projectId: string;
  members: IProjectMember[];
  createdById: string;
  userRole: UserRole;
  onMembersChanged: () => void;
}

export default function ProjectMemberManager({
  projectId,
  members,
  createdById,
  userRole,
  onMembersChanged,
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

  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const res = await getAllUsers({
        searchTerm: searchTerm.trim(),
        limit: 10,
      });
      if (res.success) {
        setSearchResults(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAddingId(userId);
    try {
      const res = await addProjectMember(projectId, userId);
      if (res.success) {
        toast.success(res.message || "Member added!");
        onMembersChanged();
        setAddDialogOpen(false);
        setSearchTerm("");
        setSearchResults([]);
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
          <Users className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-bold text-gray-900">
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
        {members.map((member) => {
          const isCreator = member.userId === createdById;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 p-4 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 leading-none">
                      {member.user.name}
                    </p>
                    {isCreator && (
                      <Badge className="bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full px-2.5 py-0.5 border border-indigo-100 hover:bg-indigo-50/80 shadow-none">
                        Creator
                      </Badge>
                    )}
                    <Badge className="bg-gray-50 text-gray-600 text-[10px] font-bold rounded-full px-2.5 py-0.5 border border-gray-100 hover:bg-gray-50/80 shadow-none">
                      {member.user.role.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {member.user.email}
                  </p>
                </div>
              </div>

              {canManageMembers && !isCreator && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400 hover:text-red-600 transition-colors"
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
          );
        })}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                />
              </div>
              <Button
                onClick={handleSearchUsers}
                disabled={searching}
                size="sm"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Search for users to add to this project
                </p>
              ) : (
                searchResults.map((user) => {
                  const isAlreadyMember = memberUserIds.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {isAlreadyMember ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Member
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddMember(user.id)}
                          disabled={addingId === user.id}
                          className="gap-1"
                        >
                          {addingId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

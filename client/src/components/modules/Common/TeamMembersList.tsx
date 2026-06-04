"use client";

import { useEffect, useState, useTransition } from "react";
import { getAllUsers } from "@/services/admin/userManagement";
import { IUser } from "@/types";

import { Search, Mail, Shield, UserCheck, UserX, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/helpers/formatters";

const TeamMembersList = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = () => {
    setLoading(true);
    startTransition(async () => {
      const response = await getAllUsers({ searchTerm, limit: 100 });
      if (response.success && response.data) {
        setUsers(response.data.data);
      }
      setLoading(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-muted-foreground text-sm">
            View all registered workspace team members and their roles.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-card text-muted-foreground">
          <Search className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No team members match your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col gap-4 relative overflow-hidden group"
            >
              {/* Card top details */}
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-slate-50 dark:border-slate-800 shadow-2xs">
                  {member.profilePhoto ? (
                    <AvatarImage src={member.profilePhoto} alt={member.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/5 text-primary text-base font-bold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {member.email}
                  </p>
                </div>
              </div>

              {/* Badges / Roles */}
              <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850/60 pt-4 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-350">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold capitalize">
                    {member.role.toLowerCase().replace("_", " ")}
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className={
                    member.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold"
                  }
                >
                  {member.status === "ACTIVE" ? (
                    <UserCheck className="h-3 w-3 mr-1" />
                  ) : (
                    <UserX className="h-3 w-3 mr-1" />
                  )}
                  {member.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamMembersList;

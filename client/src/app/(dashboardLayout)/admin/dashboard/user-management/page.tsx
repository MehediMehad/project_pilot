"use client";

import { useEffect, useState } from "react";
import UserManagementHeader from "@/components/modules/Admin/UserManagement/UserManagementHeader";
import UserTable from "@/components/modules/Admin/UserManagement/UserTable";
import UserFormDialog from "@/components/modules/Admin/UserManagement/UserFormDialog";
import UserViewDetailDialog from "@/components/modules/Admin/UserManagement/UserViewDetailDialog";
import { getAllUsers, changeUserStatus } from "@/services/admin/userManagement";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IPaginationMeta, IUser } from "@/types";

export default function UserManagementPage() {
  // Data States
  const [users, setUsers] = useState<IUser[]>([]);
  const [meta, setMeta] = useState<IPaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter/Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  // Fetch users function
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({
        searchTerm,
        status: statusFilter,
        role: roleFilter,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      if (res.success) {
        setUsers(res.data.data);
        setMeta(res.data.meta);
      } else {
        toast.error(res.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters or page changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, roleFilter, sortBy, sortOrder, page, limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Handle status toggle
  const handleToggleStatus = async (user: IUser) => {
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const toastId = toast.loading(`Updating ${user.name}'s status...`);

    try {
      const res = await changeUserStatus(user.id, newStatus);
      if (res.success) {
        toast.success(`User status updated to ${newStatus}`, { id: toastId });
        fetchUsers();
      } else {
        toast.error(res.message || "Failed to update status", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred", { id: toastId });
    }
  };

  // Handle viewing user details
  const handleViewDetails = (user: IUser) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <UserManagementHeader onAddUserClick={() => setCreateDialogOpen(true)} />

      {/* Filters bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/65 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-xl border border-border dark:border-slate-700/60 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // reset to page 1 on search
            }}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">
              Status
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] h-9 bg-background text-foreground">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">
              Role
            </span>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] h-9 bg-background text-foreground">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">
              Sort By
            </span>
            <Select
              value={`${sortBy}:${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split(":");
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 bg-background text-foreground">
                <SelectValue placeholder="Latest Created" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Latest Created</SelectItem>
                <SelectItem value="name:asc">Name (A-Z)</SelectItem>
                <SelectItem value="name:desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border dark:border-slate-700/60 bg-card/65 dark:bg-slate-900/50 backdrop-blur-md text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span>Loading user directory...</span>
          </div>
        </div>
      ) : (
        <UserTable
          users={users}
          meta={meta}
          onView={handleViewDetails}
          onToggleStatus={handleToggleStatus}
          page={page}
          setPage={setPage}
          limit={limit}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Form Dialog for Creation */}
      <UserFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchUsers}
      />

      {/* Detail Dialog */}
      <UserViewDetailDialog
        user={selectedUser}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}

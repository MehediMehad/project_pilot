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
        limit: 10,
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
  }, [searchTerm, statusFilter, roleFilter, sortBy, sortOrder, page]);

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <UserManagementHeader onAddUserClick={() => setCreateDialogOpen(true)} />

      {/* Filters bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-md border">
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
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-9 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">
              Role
            </span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-9 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">
              Sort By
            </span>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(":");
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              <option value="createdAt:desc">Latest Created</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-md border bg-card text-muted-foreground">
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

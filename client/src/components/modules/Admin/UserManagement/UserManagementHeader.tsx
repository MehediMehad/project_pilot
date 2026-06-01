import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface UserManagementHeaderProps {
  onAddUserClick: () => void;
}

export default function UserManagementHeader({
  onAddUserClick,
}: UserManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View, create, and manage system user accounts and roles.
        </p>
      </div>
      <Button onClick={onAddUserClick} className="gap-2 self-start sm:self-auto">
        <UserPlus className="h-4 w-4" />
        Add User
      </Button>
    </div>
  );
}

import { IUser } from "@/types/user.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface UserColumnActions {
  onView: (user: IUser) => void;
  onToggleStatus: (user: IUser) => void;
}

export const getUserColumns = (actions: UserColumnActions) => [
  {
    header: "Profile",
    accessor: "image",
    render: (value: unknown, row: IUser) => {
      const photoUrl = value as string | null | undefined;
      return (
        <Avatar className="h-9 w-9">
          {photoUrl ? (
            <AvatarImage
              src={photoUrl}
              alt={row.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {row.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    header: "Name",
    accessor: "name",
    render: (value: unknown) => (
      <span className="font-medium text-foreground">{value as string}</span>
    ),
  },
  {
    header: "Email",
    accessor: "email",
    render: (value: unknown) => (
      <span className="text-muted-foreground">{value as string}</span>
    ),
  },
  {
    header: "Role",
    accessor: "role",
    render: (value: unknown) => {
      const roleStr = value as string;
      let displayRole = roleStr;
      let badgeStyle = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";

      if (roleStr === "ADMIN") {
        displayRole = "Admin";
        badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10";
      } else if (roleStr === "PROJECT_MANAGER") {
        displayRole = "Project Manager";
        badgeStyle = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/10";
      } else if (roleStr === "TEAM_MEMBER") {
        displayRole = "Team Member";
        badgeStyle = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/10";
      }

      return (
        <Badge variant="outline" className={`${badgeStyle} font-bold px-2.5 py-0.5 rounded-md`}>
          {displayRole}
        </Badge>
      );
    },
  },
  {
    header: "Status",
    accessor: "status",
    render: (value: unknown, row: IUser) => {
      const statusStr = value as string;
      const isActive = statusStr === "ACTIVE";
      return (
        <button
          onClick={() => actions.onToggleStatus(row)}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none cursor-pointer ${isActive
              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
            }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-red-600"}`}
          />
          {statusStr}
        </button>
      );
    },
  },
  {
    header: "Joined Date",
    accessor: "createdAt",
    render: (value: unknown) => (
      <span className="text-muted-foreground text-sm">
        {format(new Date(value as string), "MMM dd, yyyy")}
      </span>
    ),
  },
];

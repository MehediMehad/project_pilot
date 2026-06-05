"use client";

import { IUser, IPaginationMeta } from "@/types";
import { getUserColumns, UserColumnActions } from "./userColumns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, UserCheck, UserX } from "lucide-react";

interface UserTableProps {
  users: IUser[];
  meta: IPaginationMeta;
  onView: (user: IUser) => void;
  onToggleStatus: (user: IUser) => void;
  page: number;
  setPage: (page: number) => void;
}

export default function UserTable({
  users,
  meta,
  onView,
  onToggleStatus,
  page,
  setPage,
}: UserTableProps) {
  const actions: UserColumnActions = { onView, onToggleStatus };
  const columns = getUserColumns(actions);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border dark:border-slate-700/60 bg-card/65 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.header}>{col.header}</TableHead>
              ))}
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => {
                    const value = row[col.accessor as keyof IUser];
                    return (
                      <TableCell key={col.header}>
                        {col.render ? col.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onView(row)}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(row)}
                          className="gap-2 cursor-pointer"
                        >
                          {row.status === "ACTIVE" ? (
                            <>
                              <UserX className="h-4 w-4 text-red-500" />
                              Block User
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 text-green-500" />
                              Activate User
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing Page {meta.page} of{" "}
          {Math.max(1, Math.ceil(meta.total / meta.limit))} ({meta.total} total
          users)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(meta.total / meta.limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

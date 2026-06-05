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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserTableProps {
  users: IUser[];
  meta: IPaginationMeta;
  onView: (user: IUser) => void;
  onToggleStatus: (user: IUser) => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export default function UserTable({
  users,
  meta,
  onView,
  onToggleStatus,
  page,
  setPage,
  limit,
  onLimitChange,
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
      {(() => {
        const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

        const getPageNumbers = () => {
          const pages = [];
          const maxVisiblePages = 5;

          if (totalPages <= maxVisiblePages + 2) {
            for (let i = 1; i <= totalPages; i++) {
              pages.push(i);
            }
          } else {
            pages.push(1);

            if (page > 3) {
              pages.push("...");
            }

            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);

            for (let i = start; i <= end; i++) {
              pages.push(i);
            }

            if (page < totalPages - 2) {
              pages.push("...");
            }

            pages.push(totalPages);
          }
          return pages;
        };

        return (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground font-semibold">
                Showing Page {meta.page} of {totalPages} ({meta.total} total users)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Rows per page:</span>
                <Select
                  value={meta.limit.toString()}
                  onValueChange={(val) => onLimitChange(Number(val))}
                >
                  <SelectTrigger className="w-[70px] h-8 bg-background border-border dark:border-slate-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()} className="text-xs cursor-pointer">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5 border-border dark:border-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 cursor-pointer"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>

              {getPageNumbers().map((pageNum, idx) => {
                if (pageNum === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-muted-foreground select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrent = pageNum === page;
                return (
                  <Button
                    key={`page-${pageNum}`}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 text-xs p-0 border-border dark:border-slate-800 font-semibold cursor-pointer ${
                      isCurrent
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted dark:hover:bg-slate-800/80"
                    }`}
                    onClick={() => setPage(Number(pageNum))}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5 border-border dark:border-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 cursor-pointer"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

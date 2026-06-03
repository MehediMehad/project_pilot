"use client";

import { useEffect, useState, useRef } from "react";
import { ITask, IComment, IAttachment, TaskStatus } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  User2,
  Clock,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  X,
} from "lucide-react";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
  getTaskAttachments,
  createAttachment,
  deleteAttachment,
} from "@/services/task/taskManagement";
import { toast } from "sonner";

interface TaskDetailsDialogProps {
  task: ITask;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
  currentUserId?: string;
  onStatusChange?: (newStatus: TaskStatus) => void;
}

export default function TaskDetailsDialog({
  task,
  isOpen,
  onOpenChange,
  userRole,
  currentUserId,
  onStatusChange,
}: TaskDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "attachments">("comments");
  const [comments, setComments] = useState<IComment[]>([]);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Attachment state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments and attachments
  useEffect(() => {
    if (isOpen && task?.id) {
      fetchComments();
      fetchAttachments();
    }
  }, [isOpen, task?.id]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await getTaskComments(task.id);
      if (res.success) {
        setComments(res.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchAttachments = async () => {
    setIsLoadingAttachments(true);
    try {
      const res = await getTaskAttachments(task.id);
      if (res.success) {
        setAttachments(res.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attachments");
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  // Comments CRUD
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await createComment(task.id, { content: newComment });
      if (res.success) {
        setNewComment("");
        toast.success("Comment added!");
        fetchComments();
      } else {
        toast.error(res.message || "Failed to add comment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error adding comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;

    try {
      const res = await updateComment(task.id, commentId, { content: editCommentText });
      if (res.success) {
        setEditingCommentId(null);
        setEditCommentText("");
        toast.success("Comment updated!");
        fetchComments();
      } else {
        toast.error(res.message || "Failed to update comment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await deleteComment(task.id, commentId);
      if (res.success) {
        toast.success("Comment deleted");
        fetchComments();
      } else {
        toast.error(res.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting comment");
    }
  };

  // Attachments CRUD
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await createAttachment(task.id, formData);
      if (res.success) {
        toast.success("Attachment uploaded!");
        fetchAttachments();
      } else {
        toast.error(res.message || "Failed to upload file");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const res = await deleteAttachment(task.id, attachmentId);
      if (res.success) {
        toast.success("Attachment deleted");
        fetchAttachments();
      } else {
        toast.error(res.message || "Failed to delete attachment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting attachment");
    }
  };

  // Get attachment icon based on type
  const getAttachmentIcon = (fileType: string | null) => {
    if (!fileType) return <FileIcon className="h-5 w-5 text-slate-500" />;
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text")) {
      return <FileText className="h-5 w-5 text-emerald-500" />;
    }
    return <FileIcon className="h-5 w-5 text-slate-500" />;
  };

  const formattedDueDate = new Date(task.dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const priorityColors = {
    HIGH: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-800/30",
    MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30",
    LOW: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800/30",
  };

  const statusBgColors = {
    TODO: "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200 dark:border-orange-800/30",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30",
    COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-800/30",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-xl bg-background border border-border">
        {/* Header */}
        <div className="p-6 border-b border-border bg-slate-50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {task.title}
              </DialogTitle>
              {task.project && (
                <p className="text-xs text-muted-foreground mt-1">
                  Project: <span className="font-semibold text-foreground">{task.project.name}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${priorityColors[task.priority]}`}>
                {task.priority} Priority
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusBgColors[task.status]}`}>
                {task.status === "TODO" ? "To Do" : task.status === "IN_PROGRESS" ? "In Progress" : "Completed"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Description
              </h5>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-sm text-foreground leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-800/50">
                {task.description || (
                  <span className="italic text-muted-foreground">No description provided.</span>
                )}
              </div>
            </div>

            {/* Tabs for comments & attachments */}
            <div className="space-y-4">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-[2px] ${
                    activeTab === "comments"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab("attachments")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-[2px] ${
                    activeTab === "attachments"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Paperclip className="h-4 w-4" />
                  Attachments ({attachments.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "comments" ? (
                <div className="space-y-4">
                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[42px] max-h-[120px] rounded-lg border-input flex-1 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="h-[42px] px-4 self-end shrink-0"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </form>

                  {/* Comments List */}
                  {isLoadingComments ? (
                    <div className="py-8 flex justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground italic bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border border-dashed">
                      No comments yet. Be the first to say something!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {comments.map((comment) => {
                        const isOwner = comment.userId === currentUserId;
                        const isEditing = editingCommentId === comment.id;

                        return (
                          <div
                            key={comment.id}
                            className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-3 group relative"
                          >
                            {/* Avatar */}
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 border">
                              {comment.user.image ? (
                                <img
                                  src={comment.user.image}
                                  alt={comment.user.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                comment.user.name.charAt(0)
                              )}
                            </div>

                            {/* Comment details */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-bold text-foreground">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                    ({comment.user.role.replace("_", " ")})
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {isEditing ? (
                                <div className="space-y-2 pt-1">
                                  <Textarea
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="min-h-[60px]"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingCommentId(null)}
                                      className="h-7 px-2.5 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateComment(comment.id)}
                                      className="h-7 px-2.5 text-xs"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                                  {comment.content}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            {!isEditing && (isOwner || userRole === "ADMIN") && (
                              <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentText(comment.content);
                                  }}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Upload zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted hover:border-primary/50 dark:hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/10 dark:hover:bg-slate-900/20 flex flex-col items-center justify-center gap-2 group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-foreground">Uploading file...</p>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                          <Plus className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Click to upload file</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG, or DOC (Max 10MB)</p>
                      </>
                    )}
                  </div>

                  {/* Attachments List */}
                  {isLoadingAttachments ? (
                    <div className="py-8 flex justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground italic bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border border-dashed">
                      No attachments uploaded yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border shrink-0">
                              {getAttachmentIcon(attachment.fileType)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-foreground truncate" title={attachment.fileName}>
                                {attachment.fileName}
                              </p>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(attachment.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info (Right Column) */}
          <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 h-fit space-y-4">
            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Task Details
            </h5>

            <div className="space-y-3.5 text-sm">
              {/* Due Date */}
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due Date</span>
                </div>
                <span className="font-semibold text-foreground">{formattedDueDate}</span>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  <span>Assignee</span>
                </div>
                <span className="font-semibold text-foreground">
                  {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                </span>
              </div>

              {/* Created At */}
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <span className="font-medium text-foreground">
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-slate-50 dark:bg-slate-900/50 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

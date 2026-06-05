"use client";

import { useEffect, useState, useRef } from "react";
import {
  ITask,
  IComment,
  IAttachment,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Folder,
  Tag,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
  getTaskAttachments,
  createAttachment,
  deleteAttachment,
  updateTask,
  getTaskActivityLogs,
} from "@/services/task/taskManagement";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "@/contexts/SocketContext";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskDetailsDialogProps {
  task: ITask;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
  currentUserId?: string;
  onStatusChange?: (newStatus: TaskStatus) => void;
  onPriorityChange?: (newPriority: TaskPriority) => void;
}

export default function TaskDetailsDialog({
  task: initialTask,
  isOpen,
  onOpenChange,
  userRole,
  currentUserId,
  onStatusChange,
  onPriorityChange,
}: TaskDetailsDialogProps) {
  const [task, setTask] = useState<ITask>(initialTask);
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<
    "comments" | "attachments" | "activity"
  >("comments");
  const [comments, setComments] = useState<IComment[]>([]);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Attachment state
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<IAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion states
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  // Sync initialTask changes only when dialog opens or task ID changes
  useEffect(() => {
    if (isOpen && initialTask) {
      setTask(initialTask);
    }
  }, [isOpen, initialTask?.id]);

  // Fetch comments, attachments, and activity logs
  useEffect(() => {
    if (isOpen && task?.id) {
      fetchComments();
      fetchAttachments();
      fetchActivityLogs();
    }
  }, [isOpen, task?.id]);

  // Real-time task events listener
  useEffect(() => {
    if (!isOpen || !task?.id || !socket) return;

    socket.emit("join:task", task.id);

    const handleCommentCreated = () => fetchComments();
    const handleCommentUpdated = () => fetchComments();
    const handleCommentDeleted = () => fetchComments();
    const handleAttachmentCreated = () => fetchAttachments();
    const handleAttachmentDeleted = () => fetchAttachments();
    const handleActivityCreated = () => fetchActivityLogs();
    const handleTaskDetailsUpdated = (updatedTask: any) => {
      if (updatedTask && updatedTask.id === task.id) {
        setTask(updatedTask);
        if (onStatusChange) onStatusChange(updatedTask.status);
        if (onPriorityChange) onPriorityChange(updatedTask.priority);
      }
    };

    socket.on("comment:created", handleCommentCreated);
    socket.on("comment:updated", handleCommentUpdated);
    socket.on("comment:deleted", handleCommentDeleted);
    socket.on("attachment:created", handleAttachmentCreated);
    socket.on("attachment:deleted", handleAttachmentDeleted);
    socket.on("activity:created", handleActivityCreated);
    socket.on("task:details_updated", handleTaskDetailsUpdated);

    return () => {
      socket.emit("leave:task", task.id);
      socket.off("comment:created", handleCommentCreated);
      socket.off("comment:updated", handleCommentUpdated);
      socket.off("comment:deleted", handleCommentDeleted);
      socket.off("attachment:created", handleAttachmentCreated);
      socket.off("attachment:deleted", handleAttachmentDeleted);
      socket.off("activity:created", handleActivityCreated);
      socket.off("task:details_updated", handleTaskDetailsUpdated);
    };
  }, [isOpen, task?.id, socket, onStatusChange, onPriorityChange]);

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

  const fetchActivityLogs = async () => {
    setIsLoadingActivity(true);
    try {
      const res = await getTaskActivityLogs(task.id);
      if (res.success) {
        setActivityLogs(res.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TASK_CREATED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <Plus className="h-4 w-4" />
          </div>
        );
      case "TASK_ASSIGNED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <User2 className="h-4 w-4" />
          </div>
        );
      case "TASK_UPDATED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Edit2 className="h-4 w-4" />
          </div>
        );
      case "TASK_COMPLETED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case "COMMENT_CREATED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <MessageSquare className="h-4 w-4" />
          </div>
        );
      case "ATTACHMENT_UPLOADED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Paperclip className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <Clock className="h-4 w-4" />
          </div>
        );
    }
  };

  // Task inline state updates
  const handleUpdateStatus = async (newStatus: TaskStatus) => {
    setIsUpdatingState(true);
    try {
      const res = await updateTask(task.id, task.projectId, {
        status: newStatus,
      });
      if (res.success) {
        setTask((prev) => ({ ...prev, status: newStatus }));
        if (onStatusChange) onStatusChange(newStatus);
        toast.success("Task status updated!");
        fetchActivityLogs();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleUpdatePriority = async (newPriority: TaskPriority) => {
    setIsUpdatingState(true);
    try {
      const res = await updateTask(task.id, task.projectId, {
        priority: newPriority,
      });
      if (res.success) {
        setTask((prev) => ({ ...prev, priority: newPriority }));
        if (onPriorityChange) onPriorityChange(newPriority);
        toast.success("Task priority updated!");
        fetchActivityLogs();
      } else {
        toast.error("Failed to update priority");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating priority");
    } finally {
      setIsUpdatingState(false);
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
        fetchActivityLogs();
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
      const res = await updateComment(task.id, commentId, {
        content: editCommentText,
      });
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

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
  };

  const handleDeleteCommentConfirmed = async () => {
    if (!commentToDelete) return;
    try {
      const res = await deleteComment(task.id, commentToDelete);
      if (res.success) {
        toast.success("Comment deleted");
        fetchComments();
      } else {
        toast.error(res.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting comment");
    } finally {
      setCommentToDelete(null);
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
        fetchActivityLogs();
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

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
  };

  const handleDeleteAttachmentConfirmed = async () => {
    if (!attachmentToDelete) return;
    try {
      const res = await deleteAttachment(task.id, attachmentToDelete);
      if (res.success) {
        toast.success("Attachment deleted");
        fetchAttachments();
      } else {
        toast.error(res.message || "Failed to delete attachment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting attachment");
    } finally {
      setAttachmentToDelete(null);
    }
  };

  const getAttachmentIcon = (fileType: string | null) => {
    if (!fileType) return <FileIcon className="h-6 w-6 text-slate-500" />;
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-blue-600" />;
    }
    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("text")
    ) {
      return <FileText className="h-6 w-6 text-emerald-600" />;
    }
    return <FileIcon className="h-6 w-6 text-slate-500" />;
  };

  const formattedDueDate = new Date(task.dueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const priorityStyles = {
    HIGH: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
    MEDIUM:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
    LOW: "bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  };

  const statusStyles = {
    TODO: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
    IN_PROGRESS:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30",
    COMPLETED:
      "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900/30",
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[950px] md:max-w-[1050px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl bg-background border border-border shadow-2xl transition-all duration-300">
          {/* Top Header Card */}
          <div className="relative p-6 border-b border-border bg-linear-to-r from-slate-50 to-white dark:from-slate-950 dark:to-slate-900/40">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pr-8">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs text-primary font-bold tracking-wider uppercase">
                  <Folder className="h-3.5 w-3.5" />
                  <span>{task.project?.name || "Workspace Project"}</span>
                </div>
                <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight leading-snug">
                  {task.title}
                </DialogTitle>
              </div>
            </div>
          </div>

          {/* Scrollable Layout Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Body (Left 2 Columns) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description Card */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Description
                </h5>
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-800/80 shadow-xs">
                  {task.description || (
                    <span className="italic text-slate-500 dark:text-slate-400">
                      No description provided for this task.
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Tabs Block */}
              <div className="space-y-6">
                <div className="flex border-b border-border gap-2">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 -mb-0.5 ${activeTab === "comments"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Comments
                    <span className="ml-1 px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-700 dark:text-slate-300">
                      {comments.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("attachments")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 -mb-0.5 ${activeTab === "attachments"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                  >
                    <Paperclip className="h-4 w-4" />
                    Attachments
                    <span className="ml-1 px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-700 dark:text-slate-300">
                      {attachments.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 -mb-0.5 ${activeTab === "activity"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                  >
                    <Clock className="h-4 w-4" />
                    Activity
                    <span className="ml-1 px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-700 dark:text-slate-300">
                      {activityLogs.length}
                    </span>
                  </button>
                </div>

                {/* Comments Panel */}
                {activeTab === "comments" && (
                  <div className="space-y-6">
                    {/* Styled Input Box */}
                    <form
                      onSubmit={handleAddComment}
                      className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <Textarea
                        placeholder="Write a clear, detailed comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[50px] max-h-[140px] rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-primary shadow-xs resize-none text-slate-800 dark:text-slate-200"
                      />
                      <Button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="h-[50px] w-[50px] rounded-lg px-0 shrink-0 bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer"
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </Button>
                    </form>

                    {/* List of Comments */}
                    {isLoadingComments ? (
                      <div className="py-12 flex justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No comments posted yet.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                        {comments.map((comment) => {
                          const isOwner = comment.userId === currentUserId;
                          const isEditing = editingCommentId === comment.id;

                          return (
                            <div
                              key={comment.id}
                              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex gap-4 transition-all duration-300 hover:shadow-xs group relative"
                            >
                              {/* User Avatar */}
                              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0 border border-slate-350 dark:border-slate-700">
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

                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                      {comment.user.name}
                                    </span>
                                    <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider">
                                      {comment.user.role.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                      {new Date(
                                        comment.createdAt,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  {/* <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                  {new Date(
                                    comment.createdAt,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span> */}
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2 pt-1">
                                    <Textarea
                                      value={editCommentText}
                                      onChange={(e) =>
                                        setEditCommentText(e.target.value)
                                      }
                                      className="min-h-[70px] text-slate-800 dark:text-slate-200"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingCommentId(null)}
                                        className="h-8 px-3 text-xs cursor-pointer"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateComment(comment.id)
                                        }
                                        className="h-8 px-3 text-xs bg-primary hover:bg-primary/95 text-white cursor-pointer"
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p
                                    className="text-sm text-slate-800 dark:text-slate-200                 >
 leading-relaxed font-medium"
                                  >
                                    {comment.content}
                                  </p>
                                )}
                              </div>

                              {/* Comment Action Icons */}
                              {!isEditing &&
                                (isOwner || userRole === "ADMIN") && (
                                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditCommentText(comment.content);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-primary cursor-pointer"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "attachments" && (
                  <div className="space-y-6">
                    {/* File Upload Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/40 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-900/10 dark:hover:bg-slate-900/20 flex flex-col items-center justify-center gap-3 group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {isUploading ? (
                        <>
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Uploading selected file...
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform shadow-xs">
                            <Plus className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              Click to upload files
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                              Upload images, PDFs, spreadsheets, or documents (Max
                              10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Attachments List */}
                    {isLoadingAttachments ? (
                      <div className="py-12 flex justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : attachments.length === 0 ? (
                      <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No documents or files uploaded yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4 group hover:shadow-xs transition-shadow duration-300"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="h-11 w-11 rounded-xl bg-slate-200/50 dark:bg-slate-900 flex items-center justify-center border border-slate-250 dark:border-slate-800 shrink-0">
                                {getAttachmentIcon(attachment.fileType)}
                              </div>
                              <div className="overflow-hidden">
                                <p
                                  className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                                  title={attachment.fileName}
                                >
                                  {attachment.fileName}
                                </p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                                  {new Date(
                                    attachment.createdAt,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => setPreviewAttachment(attachment)}
                                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-250 dark:hover:bg-primary cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                                className="p-2 rounded-lg text-slate-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="space-y-6">
                    {isLoadingActivity ? (
                      <div className="py-12 flex justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-primary">
                        No activity logged yet.
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-primary/30 max-h-[380px] overflow-y-auto pr-2 py-2">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="relative flex items-start gap-4 group">
                            {/* Dot / Icon container */}
                            <div className="absolute left-0 mt-0.5 shrink-0 z-10">
                              {getActivityIcon(log.type)}
                            </div>

                            {/* Detail card */}
                            <div className="flex-1 ml-10 p-3.5 rounded-xl border border-slate-200 dark:border-primary bg-primary/10 dark:bg-slate-900/50 flex items-center justify-between gap-3 shadow-xs">
                              <div className="flex items-center gap-3">
                                {/* Actor Avatar */}
                                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center uppercase overflow-hidden border border-slate-350 dark:border-slate-700 shrink-0">
                                  {log.user?.image ? (
                                    <img
                                      src={log.user.image}
                                      alt={log.user.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    log.user?.name?.charAt(0) || "U"
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-850 dark:text-slate-250">
                                    {log.message}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                    by {log.user?.name || "System"} • {log.user?.role?.replace("_", " ")}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-450 dark:text-slate-450 font-semibold shrink-0">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Columns (Right Column) */}
            <div className="space-y-6 lg:border-l lg:border-border lg:pl-8">
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Interactive Status Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                    Status
                  </span>
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleUpdateStatus(value as TaskStatus)}
                    disabled={isUpdatingState || (userRole === "TEAM_MEMBER" && task.assignedToId !== currentUserId)}
                  >
                    <SelectTrigger className={`text-xs font-semibold rounded-full border px-3 h-8 cursor-pointer disabled:opacity-50 transition-all ${statusStyles[task.status]}`}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Interactive Priority Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                    Priority
                  </span>
                  <Select
                    value={task.priority}
                    onValueChange={(value) => handleUpdatePriority(value as TaskPriority)}
                    disabled={isUpdatingState || userRole === "TEAM_MEMBER"}
                  >
                    <SelectTrigger className={`text-xs font-semibold rounded-full border px-3 h-8 cursor-pointer disabled:opacity-50 transition-all ${priorityStyles[task.priority]}`}>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low Priority</SelectItem>
                      <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                      <SelectItem value="HIGH">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary" />
                Task Details
              </h5>

              <div className="space-y-4">
                {/* Due Date Details */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Due Date</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 pl-6">
                    {formattedDueDate}
                  </span>
                </div>

                {/* Assignee Details */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <User2 className="h-4 w-4 text-primary" />
                    <span>Assignee</span>
                  </div>
                  <div className="flex items-center gap-2.5 pl-6 mt-0.5">
                    <div className="h-6 w-6 rounded-full bg-slate-350 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center uppercase overflow-hidden border border-slate-300">
                      {task.assignedTo?.image ? (
                        <img
                          src={task.assignedTo.image}
                          alt={task.assignedTo.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        task.assignedTo?.name.charAt(0) || "U"
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Date Created Details */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Created At</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 pl-6">
                    {new Date(task.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border flex justify-end bg-slate-50 dark:bg-slate-950/40 gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6 font-semibold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {previewAttachment && (
        <Dialog
          open={!!previewAttachment}
          onOpenChange={(open) => {
            if (!open) setPreviewAttachment(null);
          }}
        >
          <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] h-[85vh] max-h-[90vh] flex flex-col p-6 overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <DialogTitle className="text-base font-bold truncate max-w-[80%]">
                {previewAttachment.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[300px]">
              {(() => {
                const fileType = previewAttachment.fileType || "";
                const fileName = previewAttachment.fileName.toLowerCase();
                const isDocOrPdf = [
                  "application/pdf",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  "application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  "application/vnd.ms-powerpoint"
                ].includes(fileType) ||
                  fileName.endsWith(".pdf") ||
                  fileName.endsWith(".docx") ||
                  fileName.endsWith(".doc") ||
                  fileName.endsWith(".xlsx") ||
                  fileName.endsWith(".xls") ||
                  fileName.endsWith(".pptx") ||
                  fileName.endsWith(".ppt");

                if (fileType.startsWith("image/")) {
                  return (
                    <img
                      src={previewAttachment.fileUrl}
                      alt={previewAttachment.fileName}
                      className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                    />
                  );
                }

                if (fileType.startsWith("video/")) {
                  return (
                    <video
                      src={previewAttachment.fileUrl}
                      controls
                      className="max-w-full max-h-[75vh] rounded-lg shadow-lg"
                    />
                  );
                }

                if (fileType.startsWith("audio/")) {
                  return (
                    <audio
                      src={previewAttachment.fileUrl}
                      controls
                      className="w-full max-w-md"
                    />
                  );
                }

                if (isDocOrPdf) {
                  return (
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(previewAttachment.fileUrl)}&embedded=true`}
                      title={previewAttachment.fileName}
                      className="w-full h-[75vh] rounded-lg border shadow-xs"
                    />
                  );
                }

                return (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <FileIcon className="h-16 w-16 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Preview not available for this file type
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {previewAttachment.fileName}
                      </p>
                    </div>
                    <a
                      href={previewAttachment.fileUrl}
                      download
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition"
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </a>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmDialog
        isOpen={!!commentToDelete}
        onOpenChange={(open) => {
          if (!open) setCommentToDelete(null);
        }}
        onConfirm={handleDeleteCommentConfirmed}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
      />

      <DeleteConfirmDialog
        isOpen={!!attachmentToDelete}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null);
        }}
        onConfirm={handleDeleteAttachmentConfirmed}
        title="Delete Attachment"
        description="Are you sure you want to delete this attachment? This action cannot be undone."
      />
    </>
  );
}

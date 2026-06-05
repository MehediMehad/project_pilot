import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Are you sure you want to delete this?",
  description = "This action cannot be undone. This will permanently delete the item and remove the data from our servers.",
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] rounded-2xl p-6">
        <AlertDialogHeader className="flex flex-col items-center text-center gap-3">

          <div className="space-y-1">
            <AlertDialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 mt-4 sm:flex-row flex-col-reverse">
          <AlertDialogCancel className="w-full sm:w-auto font-semibold text-xs py-2 cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 dark:bg-rose-650 dark:hover:bg-rose-700 text-white font-bold text-xs py-2 cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

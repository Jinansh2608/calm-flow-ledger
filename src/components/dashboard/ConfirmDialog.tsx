import React from "react";
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
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 bg-white dark:bg-slate-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel onClick={onClose} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl text-white",
              variant === "danger" && "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
              variant === "primary" && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20",
              variant === "warning" && "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;

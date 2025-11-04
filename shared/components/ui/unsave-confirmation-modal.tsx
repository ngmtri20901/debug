'use client'

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { AlertTriangle, Trash2 } from "lucide-react";

interface UnsaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  flashcardText: string;
  actionType: 'unsave' | 'delete';
}

export function UnsaveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  flashcardText,
  actionType = 'unsave'
}: UnsaveConfirmationModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      const storageKey = actionType === 'delete' ? 'hideDeleteModal' : 'hideUnsaveModal';
      sessionStorage.setItem(storageKey, 'true');
    }
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const isDelete = actionType === 'delete';
  const title = isDelete 
    ? "Do you want to delete your custom flashcard?" 
    : "Do you want to unsave this flashcard?";
  
  const description = isDelete
    ? `"${flashcardText}" will be permanently deleted. This action cannot be undone.`
    : `"${flashcardText}" will be removed from your saved flashcards.`;

  const confirmButtonText = isDelete ? "Yes, Delete" : "Yes, Unsave";
  const icon = isDelete ? <Trash2 className="h-5 w-5 text-red-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />;
  const iconBgColor = isDelete ? "bg-red-100" : "bg-amber-100";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 ${iconBgColor} rounded-full flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain}
            onCheckedChange={(checked: boolean) => setDontShowAgain(checked)}
          />
          <label
            htmlFor="dontShowAgain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don&apos;t show this again
          </label>
        </div>

        <DialogFooter className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            No, Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
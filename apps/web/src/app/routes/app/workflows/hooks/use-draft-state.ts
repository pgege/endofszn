import { useState, useEffect, useMemo } from 'react';

export function useDraftState<T>(
  original: T,
  originalName: string,
  onOpenChange: (open: boolean) => void
) {
  const [draft, setDraft] = useState<T>(() => structuredClone(original));
  const [editingName, setEditingName] = useState(originalName);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    setDraft(structuredClone(original));
    setEditingName(originalName);
    setAttempted(false);
  }, [original, originalName]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(original) || editingName !== originalName,
    [draft, original, editingName, originalName]
  );

  const handleClose = (openState: boolean) => {
    if (!openState) {
      if (isDirty) {
        setShowDiscardDialog(true);
        return;
      }
      onOpenChange(false);
    }
  };

  const handleDiscard = () => {
    setDraft(structuredClone(original));
    setEditingName(originalName);
    setAttempted(false);
    setShowDiscardDialog(false);
    onOpenChange(false);
  };

  return {
    draft,
    setDraft,
    editingName,
    setEditingName,
    isDirty,
    attempted,
    setAttempted,
    showDiscardDialog,
    setShowDiscardDialog,
    handleClose,
    handleDiscard,
  };
}

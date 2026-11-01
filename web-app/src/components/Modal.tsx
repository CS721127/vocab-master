"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 id="dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="icon-button"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

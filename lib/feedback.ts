"use client";

import { toast } from "sonner";

export function emitActionFeedback(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("action-feedback", { detail: message }));
}

export function notifySuccess(message: string) {
  toast.success(message);
  emitActionFeedback(`✅ ${message}`);
}

export function notifyError(message: string) {
  toast.error(message);
  emitActionFeedback(`❌ ${message}`);
}

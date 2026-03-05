"use client";

import { useEffect, useState } from "react";

import { Toaster } from "sonner";

export function ActionFeedback() {
  const [message, setMessage] = useState("Pret.");

  useEffect(() => {
    function onFeedback(event: Event) {
      const custom = event as CustomEvent<string>;
      if (custom.detail) {
        setMessage(custom.detail);
      }
    }

    window.addEventListener("action-feedback", onFeedback as EventListener);
    return () => {
      window.removeEventListener("action-feedback", onFeedback as EventListener);
    };
  }, []);

  return (
    <>
      <Toaster richColors theme="dark" position="top-right" />
      <div
        id="action-feedback"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[80] max-w-md rounded-lg border border-zinc-700 bg-[#1a1a1a] px-3 py-2 text-xs text-zinc-200 shadow-lg"
      >
        {message}
      </div>
    </>
  );
}

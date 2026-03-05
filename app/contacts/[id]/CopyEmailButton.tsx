"use client";

import { Copy } from "lucide-react";

type Props = {
  email: string;
};

export function CopyEmailButton({ email }: Props) {
  if (!email) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(email);
  }

  return (
    <button className="btn-secondary" onClick={handleCopy} type="button">
      <Copy className="mr-2 h-4 w-4" />
      Copier email
    </button>
  );
}

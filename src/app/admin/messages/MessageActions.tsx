"use client";

import { useTransition } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";

type Props = {
  id: string;
  unread: boolean;
  archived: boolean;
  markRead: (id: string) => Promise<{ ok: boolean }>;
  toggleArchive: (id: string, next: boolean) => Promise<{ ok: boolean }>;
};

export function MessageActions({ id, unread, archived, markRead, toggleArchive }: Props) {
  const [pending, start] = useTransition();
  return (
    <>
      {unread && (
        <GlassButton
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => void (await markRead(id)))}
        >
          Mark read
        </GlassButton>
      )}
      <GlassButton
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => start(async () => void (await toggleArchive(id, !archived)))}
      >
        {archived ? "Unarchive" : "Archive"}
      </GlassButton>
    </>
  );
}

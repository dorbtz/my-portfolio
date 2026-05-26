"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "./login/actions";
import { GlassButton } from "@/shared/ui/GlassButton";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <GlassButton
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        start(async () => {
          await signOut();
          router.replace("/admin/login");
          router.refresh();
        });
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </GlassButton>
  );
}

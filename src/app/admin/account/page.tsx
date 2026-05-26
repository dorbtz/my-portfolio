import { requireAdmin } from "@/shared/lib/auth/server";
import { GlassCard } from "@/shared/ui/GlassCard";
import { SetPasswordForm } from "./SetPasswordForm";
import { SignOutButton } from "../SignOutButton";

export const metadata = { title: "Account" };

export default async function AdminAccountPage() {
  const user = await requireAdmin();

  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-accent">Account</p>
      <h1 className="text-h1 font-bold mt-2">Your admin profile</h1>

      <GlassCard padding={6} className="mt-6">
        <p className="text-caption uppercase tracking-wider text-muted">Signed in as</p>
        <p className="text-h3 font-semibold mt-1">{user.email}</p>
        <p className="text-body-sm text-muted mt-2">
          Session managed by Supabase Auth. Sign out below if you&apos;re on a shared device.
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </GlassCard>

      <GlassCard padding={6} className="mt-4">
        <p className="text-caption uppercase tracking-wider text-muted">Set / change password</p>
        <p className="text-body-sm text-muted mt-1">
          Once set, you can sign in with email + password instead of waiting for a magic link.
          Minimum 8 characters.
        </p>
        <div className="mt-4">
          <SetPasswordForm />
        </div>
      </GlassCard>
    </div>
  );
}

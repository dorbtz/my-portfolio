import { FormEvent, useState } from "react";
import { signInWithEmail } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/admin/projects" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send magic link");
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
      <p className="mt-1 text-sm opacity-70">
        Enter your email to receive a magic-link. After clicking the link, you’ll be redirected to the admin.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2 text-sm outline-none focus:border-white/20 focus:ring-2 focus:ring-cyan-400/40"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          data-thor-hover
        >
          Send magic link
        </button>
      </form>

      {sent && (
        <p className="mt-3 text-sm text-emerald-400">
          Magic link sent. Check your inbox.
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

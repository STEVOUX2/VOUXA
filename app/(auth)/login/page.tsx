import { login } from './actions';
import Link from 'next/link';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="rounded-3xl border border-vborder/50 bg-surface/80 p-10 shadow-2xl backdrop-blur-md">
      <div className="mb-10 text-center space-y-3">
        <Link href="/" className="inline-block text-4xl font-display font-black text-vtext tracking-[0.2em] uppercase">
          VOU<span className="text-primary">XA</span>
        </Link>
        <p className="text-vtext-secondary">Sign in to your account</p>
      </div>

      {searchParams.error && (
        <div className="mb-6 rounded-md bg-danger/10 p-4 text-sm text-danger border border-danger/20">
          {searchParams.error}
        </div>
      )}

      <form action={login} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-vtext-secondary" htmlFor="email">
            Email
          </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-vborder bg-background/50 px-4 py-3 text-vtext placeholder:text-vtext-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all"
              placeholder="admin@vouxa.site"
            />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-vtext-secondary" htmlFor="password">
            Password
          </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-vborder bg-background/50 px-4 py-3 text-vtext placeholder:text-vtext-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all"
              placeholder="••••••••"
            />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-3.5 font-bold tracking-wide text-white hover:bg-primary-hover active:bg-primary-pressed transition-all shadow-[0_0_20px_rgba(123,16,22,0.4)] hover:shadow-[0_0_25px_rgba(123,16,22,0.6)]"
        >
          SIGN IN
        </button>
      </form>
    </div>
  );
}

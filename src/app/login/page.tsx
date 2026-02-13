"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный email или пароль.");
      return;
    }

    window.location.href = callbackUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Вход
        </h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Войдите в рабочее пространство Popup Builder.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-6 w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-black hover:bg-black/[.04] dark:border-white/10 dark:text-white dark:hover:bg-white/[.06]"
          type="button"
        >
          Продолжить с Google
        </button>

        <div className="my-6 border-t border-black/10 dark:border-white/10" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-black/70 dark:text-white/70">
              Эл. почта
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-black/70 dark:text-white/70">
              Пароль
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <button
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            type="submit"
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          Впервые здесь?{" "}
          <Link className="text-black underline dark:text-white" href="/signup">
            Создать аккаунт
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

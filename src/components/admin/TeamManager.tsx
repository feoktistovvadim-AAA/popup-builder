"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Membership = {
  id: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  user: { name: string | null; email: string | null };
};

type Invite = {
  id: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER" | "OWNER";
  status: string;
};

const roleOptions = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

export default function TeamManager({
  memberships,
  invites,
}: {
  memberships: Membership[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("VIEWER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/v1/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    setLoading(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data?.error ?? "Не удалось пригласить участника.");
      return;
    }

    setEmail("");
    router.refresh();
  };

  const updateRole = async (membershipId: string, nextRole: string) => {
    const response = await fetch(`/api/v1/memberships/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });

    if (response.ok) {
      router.refresh();
    }
  };

  const removeMember = async (membershipId: string) => {
    const response = await fetch(`/api/v1/memberships/${membershipId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Пригласить участника
        </h2>
        <form onSubmit={sendInvite} className="mt-4 flex flex-wrap gap-3">
          <input
            className="min-w-[240px] flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
            placeholder="email@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "ADMIN" | "EDITOR" | "VIEWER")
            }
          >
            <option value="ADMIN">Администратор</option>
            <option value="EDITOR">Редактор</option>
            <option value="VIEWER">Наблюдатель</option>
          </select>
          <button
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            type="submit"
            disabled={loading}
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
        {error ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Участники команды
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          {memberships.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-black/10 px-4 py-3 dark:border-white/10"
            >
              <div>
                <div className="font-medium text-black dark:text-white">
                  {member.user.name ?? member.user.email ?? "Без имени"}
                </div>
                <div className="text-black/60 dark:text-white/60">
                  {member.user.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-black/10 bg-white px-2 py-1 text-xs text-black dark:border-white/10 dark:bg-black dark:text-white"
                  value={member.role}
                  onChange={(event) =>
                    updateRole(member.id, event.target.value)
                  }
                  disabled={member.role === "OWNER"}
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded border border-black/10 px-2 py-1 text-xs text-black/70 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/[.06]"
                  type="button"
                  onClick={() => removeMember(member.id)}
                  disabled={member.role === "OWNER"}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Ожидающие приглашения
        </h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            Нет ожидающих приглашений.
          </p>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-black/10 px-4 py-3 dark:border-white/10"
              >
                <div>
                  <div className="font-medium text-black dark:text-white">
                    {invite.email}
                  </div>
                  <div className="text-black/60 dark:text-white/60">
                    Роль: {invite.role} · {invite.status}
                  </div>
                </div>
                <span className="rounded bg-black/5 px-3 py-1 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                  Ожидание
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

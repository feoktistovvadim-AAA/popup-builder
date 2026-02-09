"use client";

import { useRouter } from "next/navigation";

type OrgOption = {
  organizationId: string;
  role: string;
  organization: { id: string; name: string; slug: string };
};

export default function OrgSwitcher({
  activeOrgId,
  memberships,
}: {
  activeOrgId: string | null;
  memberships: OrgOption[];
}) {
  const router = useRouter();

  if (memberships.length === 0) {
    return (
      <div className="text-xs text-black/60 dark:text-white/60">
        No organization
      </div>
    );
  }

  const active = memberships.find(
    (membership) => membership.organizationId === activeOrgId
  );

  return (
    <div className="space-y-1">
      <div className="text-xs text-black/50 dark:text-white/50">
        Organization
      </div>
      {memberships.length === 1 ? (
        <div className="text-sm font-medium text-black dark:text-white">
          {active?.organization.name ?? memberships[0].organization.name}
        </div>
      ) : (
        <select
          className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs text-black dark:border-white/10 dark:bg-black dark:text-white"
          value={activeOrgId ?? memberships[0].organizationId}
          onChange={async (event) => {
            await fetch("/api/v1/organizations/active", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizationId: event.target.value }),
            });
            router.refresh();
          }}
        >
          {memberships.map((membership) => (
            <option key={membership.organizationId} value={membership.organizationId}>
              {membership.organization.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

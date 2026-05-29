// Public banner of active community drives (blood / emergency / help /
// announcement). Rendered at the top of the landing and the feed — visible to
// EVERYONE, members and guests alike (founder decision: barrier-free, an
// outsider may help). Resilient: if the `drives` table doesn't exist yet or
// there's nothing active, it renders nothing — so it can ship before the
// migration is applied without breaking the page.

import { createClient } from "@/lib/supabase/server";
import { currentMs } from "@/lib/time";

type DriveRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  blood_group: string | null;
  contact_name: string | null;
  contact_info: string | null;
  expires_at: string | null;
  cities: { name: string } | null;
};

const KIND_STYLE: Record<
  string,
  { label: string; wrap: string; badge: string }
> = {
  emergency: {
    label: "Emergency",
    wrap: "border-l-brand-danger bg-brand-danger/5",
    badge: "bg-brand-danger/15 text-brand-danger",
  },
  blood: {
    label: "Blood needed",
    wrap: "border-l-brand-danger bg-brand-danger/5",
    badge: "bg-brand-danger/15 text-brand-danger",
  },
  help: {
    label: "Help drive",
    wrap: "border-l-brand-gold bg-brand-gold/5",
    badge: "bg-brand-gold/15 text-brand-warning",
  },
  announcement: {
    label: "Announcement",
    wrap: "border-l-brand-primary bg-brand-primary/5",
    badge: "bg-brand-primary/10 text-brand-primary",
  },
};

export async function ActiveDrivesBanner() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drives")
    .select(
      "id, kind, title, body, blood_group, contact_name, contact_info, expires_at, cities(name)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data || data.length === 0) return null;

  const now = currentMs();
  const drives = (data as unknown as DriveRow[])
    .filter((d) => !d.expires_at || new Date(d.expires_at).getTime() > now)
    .slice(0, 5);
  if (drives.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 pt-6">
      <div className="space-y-3">
        {drives.map((d) => {
          const s = KIND_STYLE[d.kind] ?? KIND_STYLE.announcement;
          return (
            <div
              key={d.id}
              className={`rounded-2xl border border-brand-border border-l-4 p-4 sm:p-5 ${s.wrap}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}
                >
                  {s.label}
                  {d.kind === "blood" && d.blood_group
                    ? ` · ${d.blood_group}`
                    : ""}
                </span>
                {d.cities?.name ? (
                  <span className="text-xs text-brand-text-muted">
                    {d.cities.name}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-base font-medium text-brand-text">
                {d.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-brand-text-muted">
                {d.body}
              </p>
              {d.contact_name || d.contact_info ? (
                <p className="mt-2 text-sm text-brand-text">
                  <span className="font-medium">Reach: </span>
                  {[d.contact_name, d.contact_info].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-brand-text-muted">
                Jay Hatkesh is a connector — please reach the contact directly.
                We don&apos;t manage funds or medical care.
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Admin → Drives. Publish + manage community drives (blood/emergency/help/
// announcement). Access is gated by the admin layout. Drives surface publicly
// on the home page + feed via ActiveDrivesBanner.

import { createClient } from "@/lib/supabase/server";
import { DriveForm } from "./drive-form";
import { closeDrive } from "./actions";

export const metadata = { title: "Drives — Admin" };

type DriveRow = {
  id: string;
  kind: string;
  title: string;
  status: string;
  created_at: string;
};

export default async function AdminDrivesPage() {
  const supabase = await createClient();
  const [citiesRes, drivesRes] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name")
      .eq("status", "approved")
      .order("name"),
    supabase
      .from("drives")
      .select("id, kind, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const cities = (citiesRes.data ?? []) as { id: string; name: string }[];
  const drives = (drivesRes.data ?? []) as DriveRow[];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-light text-brand-primary">Publish a drive</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Rally the community — blood, emergency, help, or an announcement. It
          shows on the home page and the feed for everyone.
        </p>
        <div className="mt-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <DriveForm cities={cities} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Existing drives
        </h2>
        {drives.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No drives yet.</p>
        ) : (
          <ul className="space-y-2">
            {drives.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-text-muted">
                    {d.kind}
                  </span>
                  <span className="ml-2 text-brand-text">{d.title}</span>
                  <span className="ml-2 text-xs text-brand-text-muted">
                    · {d.status}
                  </span>
                </div>
                {d.status === "active" ? (
                  <form action={closeDrive}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-brand-border px-3 py-1 text-xs text-brand-text transition hover:border-brand-danger hover:text-brand-danger"
                    >
                      Close
                    </button>
                  </form>
                ) : (
                  <span className="shrink-0 text-xs text-brand-text-muted">
                    closed
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

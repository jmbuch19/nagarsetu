// Admin → Surnames. Review members whose surname isn't on the recognised
// Nagar list. If a surname is a genuine Nagar surname, "Add to list" inserts it
// AND retroactively flips recognised_surname=true for every existing member
// with that surname (via admin_add_recognised_surname()). Dual purpose: catch
// non-Nagars AND grow the canonical list as new surnames surface.
//
// Surname is read-only here — `select("surname")` only — so admin sees no
// other PII just to do this review.

import { createClient } from "@/lib/supabase/server";
import { addRecognisedSurname } from "./actions";

export const metadata = { title: "Surnames — Admin" };

export default async function AdminSurnamesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("surname")
    .eq("recognised_surname", false)
    .not("surname", "is", null)
    .limit(500);

  const rows = (data ?? []) as { surname: string | null }[];

  // Group by normalised (lower/trim) surname, count members, keep the
  // display form (admin's view) from the first occurrence.
  const counts = new Map<string, { display: string; count: number }>();
  for (const r of rows) {
    const raw = (r.surname ?? "").trim();
    if (!raw) continue;
    const norm = raw.toLowerCase();
    const existing = counts.get(norm);
    if (existing) existing.count++;
    else counts.set(norm, { display: raw, count: 1 });
  }
  const groups = [...counts.entries()]
    .map(([norm, v]) => ({ norm, display: v.display, count: v.count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-brand-primary">
          Non-recognised surnames
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Members whose surname isn&apos;t on the recognised Nagar list yet. If
          a surname is a genuine Nagar surname, &ldquo;Add to recognised
          list&rdquo; — it inserts the surname and retroactively recognises
          every existing member who shares it. This is also how the canonical
          list grows.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border bg-white p-6 text-center text-sm text-brand-text-muted">
          Every member&apos;s surname is recognised.
        </p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li
              key={g.norm}
              className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium text-brand-text">{g.display}</span>
                <span className="ml-2 text-xs text-brand-text-muted">
                  · {g.count} member{g.count === 1 ? "" : "s"}
                </span>
              </div>
              <form action={addRecognisedSurname}>
                <input type="hidden" name="name" value={g.display} />
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-brand-border px-3 py-1 text-xs text-brand-text transition hover:border-brand-success hover:text-brand-success"
                >
                  Add to recognised list
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

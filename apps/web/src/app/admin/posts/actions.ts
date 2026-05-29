"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "../../profile/constants";

// Admin closes another member's stale listing/request. The RPC is
// is_admin()-gated server-side; the checks here are belt-and-braces.
export async function adminClosePost(formData: FormData): Promise<void> {
  const kind = String(formData.get("kind") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id) || (kind !== "listing" && kind !== "request")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("admin_close_post", { p_kind: kind, p_id: id });

  revalidatePath("/admin/posts");
  revalidatePath("/");
  revalidatePath("/feed");
}

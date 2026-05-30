"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Admin adds a vetted surname to the recognised Nagar list. The RPC is
// is_admin()-gated server-side; insertion + the retroactive
// members.recognised_surname flip both happen inside the SECURITY DEFINER
// function (both writes are otherwise blocked by RLS / column grants).
export async function addRecognisedSurname(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("admin_add_recognised_surname", { p_name: name });

  revalidatePath("/admin/surnames");
  revalidatePath("/profile");
  revalidatePath("/directory");
}

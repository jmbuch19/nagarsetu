"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewState = { ok: boolean; message?: string };

// Approve / reject an ID verification. The real authorization is in the
// is_admin()-gated SECURITY DEFINER function admin_review_verification — this
// action just forwards. A non-admin who somehow reached it gets the function's
// "not authorized" error.
export async function reviewVerification(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const id = formData.get("verification_id");
  const decision = formData.get("decision");
  const notesRaw = formData.get("notes");
  const verificationId = typeof id === "string" ? id : "";
  const notes = typeof notesRaw === "string" ? notesRaw.trim() : "";

  if (!UUID_RE.test(verificationId) || (decision !== "approve" && decision !== "reject"))
    return { ok: false, message: "Something went wrong." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_verification", {
    p_verification_id: verificationId,
    p_approve: decision === "approve",
    p_notes: notes || null,
  });

  if (error)
    return { ok: false, message: "Could not save the review. Please try again." };

  revalidatePath("/admin/verifications");
  return {
    ok: true,
    message: decision === "approve" ? "Approved." : "Rejected.",
  };
}

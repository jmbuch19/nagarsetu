"use server";

import { contact } from "@nagarsetu/shared";
import { sendEmail } from "@/lib/email/send";
import { contactQueryEmail } from "@/lib/email/templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 120;
const MESSAGE_MAX = 4000;

export type ContactField = "name" | "email" | "phone" | "message" | "captcha";

export type ContactState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<ContactField, string>>;
};

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

// Public (anon-callable) contact form. Server-validates a simple math captcha
// (the a/b come from the rendered form; the answer must equal a+b) as a light
// anti-bot guard, then emails the query to the project inbox with reply-to set
// to the submitter. No DB row — the founder's inbox is the collection.
export async function submitContactQuery(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const message = field(formData, "message");
  const a = Number(field(formData, "captcha_a"));
  const b = Number(field(formData, "captcha_b"));
  const answer = Number(field(formData, "captcha_answer"));

  const errors: Partial<Record<ContactField, string>> = {};
  if (!name) errors.name = "Please enter your name.";
  else if (name.length > NAME_MAX) errors.name = "Please shorten your name.";
  if (!email) errors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email) || email.length > 254)
    errors.email = "Please enter a valid email.";
  if (!message) errors.message = "Please write your message.";
  else if (message.length > MESSAGE_MAX)
    errors.message = `Please keep it under ${MESSAGE_MAX} characters.`;
  if (!Number.isFinite(a) || !Number.isFinite(b) || answer !== a + b)
    errors.captcha = "Please solve the sum correctly.";

  if (Object.keys(errors).length > 0)
    return { ok: false, errors, message: "Please fix the highlighted fields." };

  const { subject, html } = contactQueryEmail(name, email, phone, message);
  const { ok } = await sendEmail({
    to: contact.email,
    subject,
    html,
    replyTo: email,
  });

  if (!ok)
    return {
      ok: false,
      message:
        "Sorry — we couldn't send your message just now. Please try again, or email us directly.",
    };

  return {
    ok: true,
    message: "Thank you — your message reached us. We'll reply within a working day.",
  };
}

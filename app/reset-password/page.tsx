import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Set a New Password",
  description: `Choose a new password for your ${BRAND.name} account.`,
  alternates: { canonical: "/reset-password" },
  // Never index — these URLs carry one-time recovery tokens.
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token_hash, type, next, error } = await searchParams;

  return (
    <ResetPasswordClient
      tokenHash={token_hash ?? null}
      type={type ?? null}
      next={next ?? "/"}
      initialError={error ?? null}
    />
  );
}

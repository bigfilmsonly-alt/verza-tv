// Stubbed auth helpers — swap to Supabase Auth in production

export async function getUser(): Promise<{ id: string; email: string } | null> {
  // TODO: implement with Supabase Auth
  return null; // not signed in
}

export async function requireAuth(): Promise<{ id: string; email: string }> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

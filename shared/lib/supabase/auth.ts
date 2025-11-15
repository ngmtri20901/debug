import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "./server";

export type ServerUser = {
  id: string;
  email?: string | null;
};

export async function getUserOrNull(): Promise<ServerUser | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  const user = data.user;
  if (!user) return null;
  return { id: user.id, email: user.email };
}

export async function requireUser(): Promise<ServerUser> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  return user!;
}



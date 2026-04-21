"use server";

import { revalidatePath } from "next/cache";
import { SessionData } from "./session.config";
import { getSession } from "./session";

export async function setSessionData(data: Partial<SessionData>) {
  const session = await getSession();
  Object.assign(session, data);
  await session.save();
  revalidatePath("/", "layout");
  return { success: true as const, data: session };
}

export async function getSessionData(keys?: string[]) {
  const session = await getSession();
  if (!keys?.length) return session;
  const filtered: Partial<SessionData> = {};
  for (const key of keys) {
    if (key in session) {
      filtered[key as keyof SessionData] = session[key as keyof SessionData];
    }
  }
  return filtered;
}

export async function updateSessionField<K extends keyof SessionData>(
  key: K,
  value: SessionData[K],
) {
  const session = await getSession();
  session[key] = value;
  await session.save();
  revalidatePath("/", "layout");
  return { success: true as const, [key]: value };
}

export async function deleteSessionField(key: keyof SessionData) {
  const session = await getSession();
  delete session[key];
  await session.save();
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
  revalidatePath("/", "layout");
}
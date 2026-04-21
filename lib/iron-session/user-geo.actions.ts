"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "./session";

function validCoords(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function saveUserCurrentGeolocation(payload: {
  latitude: number;
  longitude: number;
}) {
  const { latitude, longitude } = payload;
  if (!validCoords(latitude, longitude)) {
    return { success: false as const, error: "Invalid coordinates" };
  }

  const session = await getSession();
  session.userCurrentLatitude = latitude;
  session.userCurrentLongitude = longitude;
  session.userGeoUpdatedAt = new Date().toISOString();
  await session.save();
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function clearUserCurrentGeolocation() {
  const session = await getSession();
  delete session.userCurrentLatitude;
  delete session.userCurrentLongitude;
  delete session.userGeoUpdatedAt;
  await session.save();
  revalidatePath("/", "layout");
  return { success: true as const };
}

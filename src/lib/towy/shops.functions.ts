import { createServerFn } from "@tanstack/react-start";

export const findDrop = createServerFn({ method: "POST" })
  .validator((data: { lat: number; lng: number }) => {
    if (!data || typeof data.lat !== "number" || typeof data.lng !== "number") {
      throw new Error("Need this phone's location.");
    }
    if (Math.abs(data.lat) > 90 || Math.abs(data.lng) > 180) {
      throw new Error("That location is not usable.");
    }
    return { lat: data.lat, lng: data.lng };
  })
  .handler(async ({ data }) => {
    const { lookupDrop } = await import("./shops.server");
    return lookupDrop(data.lat, data.lng);
  });

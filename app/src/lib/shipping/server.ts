import "server-only";

import { connectDB } from "@/lib/db/mongoose";
import { priceInCents, shippingRegionPattern, type ShippingRegion } from "@/lib/checkout/validation";
import { ShippingZone } from "@/models/ShippingZone";

const defaults = [
  { slug: "west_bank", name: { ar: "الضفة الغربية", en: "West Bank" }, shippingFee: 20 },
  { slug: "jerusalem", name: { ar: "القدس", en: "Jerusalem" }, shippingFee: 30 },
  { slug: "inside_48", name: { ar: "مناطق ٤٨", en: "48 Areas" }, shippingFee: 70 },
] as const;

export async function initializeShippingRegions() {
  await connectDB();
  await ShippingZone.init();
  for (const [sortOrder, region] of defaults.entries()) {
    const now = new Date();
    await ShippingZone.updateOne(
      { slug: region.slug },
      { $setOnInsert: { ...region, isActive: true, sortOrder, createdAt: now, updatedAt: now } },
      { upsert: true, timestamps: false },
    );
  }
  await ShippingZone.updateOne(
    { slug: "inside_48", "name.ar": { $in: ["الداخل 48", "الداخل ٤٨", "مناطق الداخل 48"] } },
    { $set: { "name.ar": "مناطق ٤٨" } },
    { timestamps: false },
  );
  await ShippingZone.updateOne(
    { slug: "inside_48", "name.en": { $in: ["Inside 48", "Inside 48 areas"] } },
    { $set: { "name.en": "48 Areas" } },
    { timestamps: false },
  );
}

export async function getShippingRegions() {
  await initializeShippingRegions();
  const zones = await ShippingZone.find({ slug: shippingRegionPattern })
    .select("_id slug name shippingFee isActive updatedAt")
    .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
    .lean();
  return zones.map((zone) => {
    if (priceInCents(zone.shippingFee) === null)
      throw new Error(`Shipping configuration unavailable for ${zone.slug}`);
    return {
      id: zone._id.toString(),
      slug: zone.slug,
      name: zone.name,
      shippingFee: zone.shippingFee,
      isActive: zone.isActive,
      updatedAt: zone.updatedAt,
    };
  });
}

export async function getShippingRegionForCheckout(
  region: ShippingRegion,
  session: import("mongoose").ClientSession,
) {
  // Initialization happens before the transaction, while this read shares its snapshot.
  const zone = await ShippingZone.findOne({ slug: region }).session(session).lean();
  if (!zone?.isActive || priceInCents(zone.shippingFee) === null) return null;
  return zone;
}

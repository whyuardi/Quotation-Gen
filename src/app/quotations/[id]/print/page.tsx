import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintDocument from "./PrintDocument";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          priceItems: { orderBy: { sortOrder: "asc" } },
          images: true,
        },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  // Get irradiation cache for this lat/lng
  let irradiationCache = null;
  if (quotation.latitude && quotation.longitude) {
    const lat = Math.round(quotation.latitude * 100) / 100;
    const lng = Math.round(quotation.longitude * 100) / 100;
    irradiationCache = await prisma.locationIrradiationCache.findFirst({
      where: {
        latitude: {
          gte: lat - 0.05,
          lte: lat + 0.05,
        },
        longitude: {
          gte: lng - 0.05,
          lte: lng + 0.05,
        },
      },
    });
  }

  // Serialize data for the client component
  const data = {
    ...quotation,
    date: quotation.date.toISOString(),
    validityDate: quotation.validityDate.toISOString(),
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    irradiationCache: irradiationCache ? {
      ...irradiationCache,
      fetchedAt: irradiationCache.fetchedAt.toISOString(),
    } : null,
    product: {
      ...quotation.product,
      createdAt: quotation.product.createdAt.toISOString(),
      updatedAt: quotation.product.updatedAt.toISOString(),
      priceItems: quotation.product.priceItems.map((item) => ({
        ...item,
        pricePerUnitUsd: item.pricePerUnitUsd.toString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      images: quotation.product.images.map((img) => ({
        ...img,
        createdAt: img.createdAt.toISOString(),
      })),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PrintDocument quotation={data as any} />;
}

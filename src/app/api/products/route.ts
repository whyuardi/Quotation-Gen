import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products — list all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        priceItems: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { quotations: true, images: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      modelCode,
      specs,
      pumpCurveData,
      dimensionTable,
      netWeight,
      priceItems,
      images,
    } = body;

    if (!name || !modelCode || !specs) {
      return NextResponse.json(
        { error: "name, modelCode, and specs are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        modelCode,
        specs,
        pumpCurveData: pumpCurveData || undefined,
        dimensionTable: dimensionTable || undefined,
        netWeight: netWeight || undefined,
        priceItems: priceItems
          ? {
              create: priceItems.map(
                (
                  item: {
                    description: string;
                    qtyIn1Set: number;
                    unit: string;
                    pricePerUnitUsd: number;
                    sortOrder: number;
                  },
                  index: number
                ) => ({
                  description: item.description,
                  qtyIn1Set: item.qtyIn1Set,
                  unit: item.unit || "pcs",
                  pricePerUnitUsd: item.pricePerUnitUsd,
                  sortOrder: item.sortOrder ?? index,
                })
              ),
            }
          : undefined,
        images: images
          ? {
              create: images.map((img: { type: any; url: string; caption?: string }) => ({
                type: img.type,
                url: img.url,
                caption: img.caption || null,
              })),
            }
          : undefined,
      },
      include: {
        priceItems: { orderBy: { sortOrder: "asc" } },
        images: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

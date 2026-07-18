import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products/[id] — get single product with all relations
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        priceItems: { orderBy: { sortOrder: "asc" } },
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — update product and upsert price items
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

      // Update product in a transaction
      const product = await prisma.$transaction(async (tx) => {
        // Update product fields
        const updated = await tx.product.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(modelCode && { modelCode }),
            ...(specs && { specs }),
            ...(pumpCurveData !== undefined && { pumpCurveData }),
            ...(dimensionTable !== undefined && { dimensionTable }),
            ...(netWeight !== undefined && { netWeight }),
          },
        });

        // If priceItems provided, replace all
        if (priceItems) {
          await tx.priceItem.deleteMany({ where: { productId: id } });
          await tx.priceItem.createMany({
            data: priceItems.map(
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
                productId: id,
                description: item.description,
                qtyIn1Set: item.qtyIn1Set,
                unit: item.unit || "pcs",
                pricePerUnitUsd: item.pricePerUnitUsd,
                sortOrder: item.sortOrder ?? index,
              })
            ),
          });
        }

        // If images provided, replace all
        if (images) {
          await tx.productImage.deleteMany({ where: { productId: id } });
          await tx.productImage.createMany({
            data: images.map((img: { type: any; url: string; caption?: string }) => ({
              productId: id,
              type: img.type,
              url: img.url,
              caption: img.caption || null,
            })),
          });
        }

        return updated;
      });

    const result = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        priceItems: { orderBy: { sortOrder: "asc" } },
        images: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

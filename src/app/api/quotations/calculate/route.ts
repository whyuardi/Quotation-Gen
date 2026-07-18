import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateQuotationTotals } from "@/lib/calculations";

export const dynamic = "force-dynamic";

// POST /api/quotations/calculate — calculate totals without saving
export async function POST(request: Request) {
  try {
    const { productId, numPumpsets } = await request.json();

    if (!productId || !numPumpsets) {
      return NextResponse.json(
        { error: "productId and numPumpsets are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        priceItems: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const totals = calculateQuotationTotals(
      product.priceItems.map((item) => ({
        description: item.description,
        qtyIn1Set: item.qtyIn1Set,
        pricePerUnitUsd: item.pricePerUnitUsd.toString(),
        sortOrder: item.sortOrder,
        unit: item.unit,
      })),
      numPumpsets
    );

    return NextResponse.json(totals);
  } catch (error) {
    console.error("Error calculating totals:", error);
    return NextResponse.json(
      { error: "Failed to calculate totals" },
      { status: 500 }
    );
  }
}

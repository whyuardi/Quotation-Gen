import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateQuotationTotals } from "@/lib/calculations";

export const dynamic = "force-dynamic";

// GET /api/quotations/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 }
    );
  }
}

// PUT /api/quotations/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      clientName,
      clientCompany,
      projectLocationName,
      latitude,
      longitude,
      numPumpsets,
      paymentTerms,
      shipmentSchedule,
      status,
      validityDate,
    } = body;

    // If numPumpsets changed, recalculate totals
    let calculatedTotals = undefined;
    if (numPumpsets) {
      const quotation = await prisma.quotation.findUnique({
        where: { id },
        include: {
          product: {
            include: { priceItems: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      if (quotation) {
        const totals = calculateQuotationTotals(
          quotation.product.priceItems.map((item) => ({
            description: item.description,
            qtyIn1Set: item.qtyIn1Set,
            pricePerUnitUsd: item.pricePerUnitUsd.toString(),
            sortOrder: item.sortOrder,
            unit: item.unit,
          })),
          numPumpsets
        );
        calculatedTotals = JSON.parse(JSON.stringify(totals));
      }
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        ...(clientName && { clientName }),
        ...(clientCompany !== undefined && { clientCompany }),
        ...(projectLocationName !== undefined && { projectLocationName }),
        ...(latitude !== undefined && {
          latitude: latitude ? parseFloat(latitude) : null,
        }),
        ...(longitude !== undefined && {
          longitude: longitude ? parseFloat(longitude) : null,
        }),
        ...(numPumpsets && { numPumpsets }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(shipmentSchedule !== undefined && { shipmentSchedule }),
        ...(status && { status }),
        ...(validityDate && { validityDate: new Date(validityDate) }),
        ...(calculatedTotals && { calculatedTotals }),
      },
      include: {
        product: {
          select: { id: true, name: true, modelCode: true },
        },
      },
    });

    // Pre-fetch and cache irradiation data
    if (updated.latitude && updated.longitude) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${appUrl}/api/irradiation?latitude=${updated.latitude}&longitude=${updated.longitude}`).catch(console.error);
      } catch (err) {
        console.error("Failed to pre-fetch irradiation cache on update:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json(
      { error: "Failed to delete quotation" },
      { status: 500 }
    );
  }
}

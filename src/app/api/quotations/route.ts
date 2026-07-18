import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateRefNumber, getNextSequenceNumber } from "@/lib/ref-number";
import { calculateQuotationTotals } from "@/lib/calculations";

export const dynamic = "force-dynamic";

// GET /api/quotations — list all quotations
export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        product: {
          select: { id: true, name: true, modelCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}

// POST /api/quotations — create a new quotation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productId,
      numPumpsets,
      clientName,
      clientCompany,
      projectLocationName,
      latitude,
      longitude,
      paymentTerms,
      shipmentSchedule,
      date,
      validityDate,
    } = body;

    if (!productId || !numPumpsets || !clientName) {
      return NextResponse.json(
        { error: "productId, numPumpsets, and clientName are required" },
        { status: 400 }
      );
    }

    // Get product with price items
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

    // Calculate totals server-side
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

    // Generate ref number
    const quotationDate = date ? new Date(date) : new Date();
    const seqNumber = await getNextSequenceNumber(prisma, quotationDate);
    const refNumber = generateRefNumber(seqNumber, quotationDate);

    // Default validity: 30 days from date
    const defaultValidity = new Date(quotationDate);
    defaultValidity.setDate(defaultValidity.getDate() + 30);

    const quotation = await prisma.quotation.create({
      data: {
        refNumber,
        date: quotationDate,
        validityDate: validityDate
          ? new Date(validityDate)
          : defaultValidity,
        clientName,
        clientCompany: clientCompany || null,
        projectLocationName: projectLocationName || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        productId,
        numPumpsets,
        paymentTerms:
          paymentTerms ||
          "100 % Advance Payment Or 30 % Advance Payment and 70 % Balance before Dispatch",
        shipmentSchedule: shipmentSchedule || "Shipment Schedule 4 - 6 Weeks",
        calculatedTotals: JSON.parse(JSON.stringify(totals)),
      },
      include: {
        product: {
          select: { id: true, name: true, modelCode: true },
        },
      },
    });

    // Pre-fetch and cache irradiation data
    if (latitude && longitude) {
      try {
        const flowLpm = (product.specs as any)?.flow_lpm || 56;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${appUrl}/api/irradiation?latitude=${latitude}&longitude=${longitude}&flowLpm=${flowLpm}`).catch(console.error);
      } catch (err) {
        console.error("Failed to pre-fetch irradiation cache:", err);
      }
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    );
  }
}

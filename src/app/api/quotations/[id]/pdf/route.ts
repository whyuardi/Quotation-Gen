import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";

export const dynamic = "force-dynamic";

// Dynamic configuration for Vercel Hobby serverless limits
export const maxDuration = 15; // Set to 15 seconds

async function getBrowser() {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    const chromium = (await import("@sparticuz/chromium")).default as any;
    const puppeteer = (await import("puppeteer-core")).default;

    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless === "true" || chromium.headless === true,
    });
  } else {
    const puppeteer = (await import("puppeteer-core")).default;

    const windowsChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const windowsChromeX86Path = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    let executablePath = windowsChromePath;
    if (fs.existsSync(windowsChromePath)) {
      executablePath = windowsChromePath;
    } else if (fs.existsSync(windowsChromeX86Path)) {
      executablePath = windowsChromeX86Path;
    } else if (fs.existsSync(edgePath)) {
      executablePath = edgePath;
    } else {
      throw new Error("Could not find local Chrome or Edge installation for PDF generation.");
    }

    return await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath,
      headless: true,
    });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser = null;
  try {
    const { id } = await params;

    // Check if quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { refNumber: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    browser = await getBrowser();
    const page = await browser.newPage();

    // Use current application host URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const printUrl = `${appUrl}/quotations/${id}/print`;

    console.log(`Puppeteer opening print route: ${printUrl}`);

    await page.goto(printUrl, {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Wait for the mounted state of charts
    try {
      await page.waitForSelector(".recharts-wrapper", { timeout: 3000 });
      // Extra delay to let Recharts complete smooth opacity animation
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      console.log("No charts found or wait timeout reached.");
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Crucial for displaying golden/yellow table colors
      margin: {
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
      },
    });

    // Clean filename like "Quotation_002_JGD_VII_26.pdf"
    const safeRef = quotation.refNumber.replace(/\//g, "_");
    const filename = `Quotation_${safeRef}.pdf`;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF. Make sure server is running and database is fully seeded." },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error("Failed to close browser:", err);
      }
    }
  }
}

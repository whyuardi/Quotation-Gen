import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/irradiation?latitude=-0.79&longitude=113.92&flowLpm=56
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("latitude");
    const lngStr = searchParams.get("longitude");
    const flowLpmStr = searchParams.get("flowLpm") || "56";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    const flowLpm = parseFloat(flowLpmStr);

    // Round to 2 decimals for cache key
    const cacheLat = Math.round(latitude * 100) / 100;
    const cacheLng = Math.round(longitude * 100) / 100;

    // Check cache
    let cacheEntry = await prisma.locationIrradiationCache.findUnique({
      where: {
        latitude_longitude: {
          latitude: cacheLat,
          longitude: cacheLng,
        },
      },
    });

    let monthlyIrradiation: Record<string, number>;

    if (cacheEntry) {
      console.log(`Cache hit for (${cacheLat}, ${cacheLng})`);
      monthlyIrradiation = cacheEntry.monthlyIrradiation as Record<string, number>;
    } else {
      console.log(`Cache miss for (${cacheLat}, ${cacheLng}). Fetching from NASA POWER API...`);
      // Call NASA POWER API Climatology endpoint
      const nasaUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${cacheLng}&latitude=${cacheLat}&format=JSON`;
      
      const nasaRes = await fetch(nasaUrl);
      if (!nasaRes.ok) {
        throw new Error(`NASA API returned status ${nasaRes.status}`);
      }

      const nasaData = await nasaRes.json();
      const parameterData = nasaData?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
      
      if (!parameterData) {
        throw new Error("Invalid response format from NASA API");
      }

      // Extract 12 months (exclude ANN annual average if present)
      monthlyIrradiation = {
        JAN: Number(parameterData.JAN || 0),
        FEB: Number(parameterData.FEB || 0),
        MAR: Number(parameterData.MAR || 0),
        APR: Number(parameterData.APR || 0),
        MAY: Number(parameterData.MAY || 0),
        JUN: Number(parameterData.JUN || 0),
        JUL: Number(parameterData.JUL || 0),
        AUG: Number(parameterData.AUG || 0),
        SEP: Number(parameterData.SEP || 0),
        OCT: Number(parameterData.OCT || 0),
        NOV: Number(parameterData.NOV || 0),
        DEC: Number(parameterData.DEC || 0),
      };

      // Compute flow volume for cache
      const avgDailyFlowLiter: Record<string, number> = {};
      const baseFlowFactor = flowLpm * 60; // flow in one peak sun hour
      Object.entries(monthlyIrradiation).forEach(([month, irr]) => {
        avgDailyFlowLiter[month] = Math.round(baseFlowFactor * irr * 100) / 100;
      });

      // Save to cache
      cacheEntry = await prisma.locationIrradiationCache.create({
        data: {
          latitude: cacheLat,
          longitude: cacheLng,
          monthlyIrradiation,
          avgDailyFlowLiter,
        },
      });
    }

    // Recalculate flow volume dynamically if flowLpm is different from the cached one
    const computedFlow: Record<string, number> = {};
    const baseFlowFactor = flowLpm * 60;
    Object.entries(monthlyIrradiation).forEach(([month, irr]) => {
      computedFlow[month] = Math.round(baseFlowFactor * irr * 100) / 100;
    });

    return NextResponse.json({
      latitude: cacheLat,
      longitude: cacheLng,
      monthlyIrradiation,
      avgDailyFlowLiter: computedFlow,
    });
  } catch (error) {
    console.error("Error fetching irradiation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch irradiation data" },
      { status: 500 }
    );
  }
}

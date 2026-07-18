import { PrismaClient, ImageType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Create Product: SOLAR 2 DCSSP 3000 ────────────────────────────────

  const product = await prisma.product.upsert({
    where: { modelCode: "SOLAR-2-DCSSP-3000" },
    update: {},
    create: {
      name: "SOLAR 2 DCSSP 3000",
      modelCode: "SOLAR-2-DCSSP-3000",
      specs: {
        // Pump specs
        head_range: "60-138",
        flow_lpm: 56,
        discharge: "86-50",
        suction_size_mm: "4x4",
        delivery_size_mm: 32,
        pv_watt: 3000,
        pump_outlet: "BSP 32 MM",
        joining: "4X4 Inch",
        impeller: "SS 304",
        shaft: "Duplex",
        casing: "SS 304",
        max_water_temp: "40°C",
        pumpset_code: "9500001986",
        order_code: "9500002427",

        // Motor specs
        motor_power_kw: 2.2,
        motor_power_hp: 3,
        motor_speed_range: "Min. 1000 Max. 3600",
        motor_efficiency: "Max. 86.00 %",
        motor_enclosure_class: "IP67",
        motor_code: "9000030562",
        motor_type: "Maintenance-free PMS motor",
        motor_features: [
          "Maintenance-free PMS motor",
          "Water filled",
          "Premium materials, stainless steel: AISI 304",
          "No electronics in the motor",
        ],

        // Controller specs
        controller_name: "SIMHA UNIVERSAL DRIVE+3P 15A 450VDC",
        controller_input_voltage: "Max. 450 V",
        controller_min_voltage: "30 V",
        controller_max_eff: "93 %",
        controller_current: "15 A",
        controller_enclosure_class: "IP 65",
        controller_ambient_temp: "-20 to 70 °C",
        controller_features: [
          "Integrated MPPT (Maximum Power Point Tracking)",
          "Controlling and remote monitoring",
          "Sensor less dry run protection, remote control etc",
          "Protected against reverse polarity, overload and overtemperature",
        ],

        // Pump features
        pump_features: [
          "Built in Non-Return valve",
          "Premium materials, stainless steel: AISI 304",
          "Centrifugal Pump",
        ],
      },

      // Pump curve data: Flow (LPM) vs Power (Watt) at different heads
      pumpCurveData: [
        {
          head: 60,
          points: [
            { power_watt: 500, flow_lpm: 0 },
            { power_watt: 750, flow_lpm: 20 },
            { power_watt: 1000, flow_lpm: 38 },
            { power_watt: 1250, flow_lpm: 50 },
            { power_watt: 1500, flow_lpm: 58 },
            { power_watt: 1750, flow_lpm: 65 },
            { power_watt: 2000, flow_lpm: 70 },
            { power_watt: 2250, flow_lpm: 75 },
            { power_watt: 2500, flow_lpm: 78 },
            { power_watt: 2750, flow_lpm: 82 },
            { power_watt: 3000, flow_lpm: 86 },
          ],
        },
        {
          head: 90,
          points: [
            { power_watt: 500, flow_lpm: 0 },
            { power_watt: 750, flow_lpm: 10 },
            { power_watt: 1000, flow_lpm: 25 },
            { power_watt: 1250, flow_lpm: 36 },
            { power_watt: 1500, flow_lpm: 44 },
            { power_watt: 1750, flow_lpm: 50 },
            { power_watt: 2000, flow_lpm: 56 },
            { power_watt: 2250, flow_lpm: 60 },
            { power_watt: 2500, flow_lpm: 65 },
            { power_watt: 2750, flow_lpm: 70 },
            { power_watt: 3000, flow_lpm: 75 },
          ],
        },
        {
          head: 120,
          points: [
            { power_watt: 750, flow_lpm: 0 },
            { power_watt: 1000, flow_lpm: 10 },
            { power_watt: 1250, flow_lpm: 22 },
            { power_watt: 1500, flow_lpm: 30 },
            { power_watt: 1750, flow_lpm: 36 },
            { power_watt: 2000, flow_lpm: 42 },
            { power_watt: 2250, flow_lpm: 46 },
            { power_watt: 2500, flow_lpm: 50 },
            { power_watt: 2750, flow_lpm: 53 },
            { power_watt: 3000, flow_lpm: 56 },
          ],
        },
        {
          head: 138,
          points: [
            { power_watt: 1000, flow_lpm: 0 },
            { power_watt: 1250, flow_lpm: 12 },
            { power_watt: 1500, flow_lpm: 22 },
            { power_watt: 1750, flow_lpm: 30 },
            { power_watt: 2000, flow_lpm: 36 },
            { power_watt: 2250, flow_lpm: 40 },
            { power_watt: 2500, flow_lpm: 44 },
            { power_watt: 2750, flow_lpm: 48 },
            { power_watt: 3000, flow_lpm: 50 },
          ],
        },
      ],

      // Dimension tables (in mm)
      dimensionTable: {
        pump: {
          A: 952,
          B: 345,
          C: 607,
          D: 95,
          E: 97,
          Rp: 32,
        },
        controller: {
          A: 315,
          B: 286,
          C: 270,
          D: 60,
          E: 166,
          F: 270,
          G: 244,
        },
      },

      // Net weight
      netWeight: {
        pump: "NA",
        motor: null,
        controller: "NA",
      },
    },
  });

  console.log(`✅ Product created: ${product.name} (${product.id})`);

  // ─── Create Price Items (BOM) ──────────────────────────────────────────

  // Delete existing price items for this product to avoid duplicates on re-seed
  await prisma.priceItem.deleteMany({
    where: { productId: product.id },
  });

  const priceItems = [
    {
      description: `SOLAR 2 DCSSP 3000\n(Pump + Motor + Controller ) (With Grid)\nP.V Watt : 3000.00, Head (M) : 60-138\nDischarge (LPM) : 86-50,\nSuction Size (mm): 4"x4"\nDelivery Size (mm) : 32.00`,
      qtyIn1Set: 1,
      unit: "set",
      pricePerUnitUsd: 746.25,
      sortOrder: 1,
    },
    {
      description: `Mono Crystalline Solar Panel (600 Watt Each Panel)\nP.V Watt : 3600.00`,
      qtyIn1Set: 6,
      unit: "pcs",
      pricePerUnitUsd: 114.0,
      sortOrder: 2,
    },
    {
      description: "Solar Stand assembly for 3 Mono panels",
      qtyIn1Set: 2,
      unit: "set",
      pricePerUnitUsd: 104.62,
      sortOrder: 3,
    },
    {
      description:
        "PVC Cable 10 Sqmm x 3 core (As per 120m depth + 10m extra)",
      qtyIn1Set: 130,
      unit: "m",
      pricePerUnitUsd: 6.52,
      sortOrder: 4,
    },
    {
      description:
        "4Sq mm X 1 Core Shakti PVC Cable (DC Cable, Red) (Per Stand - 15m)",
      qtyIn1Set: 30,
      unit: "m",
      pricePerUnitUsd: 0.95,
      sortOrder: 5,
    },
    {
      description:
        "4 Sq mm X 1 Core Shakti PVC Cable (DC Cable, Black) (Per Stand - 15m)",
      qtyIn1Set: 30,
      unit: "m",
      pricePerUnitUsd: 0.95,
      sortOrder: 6,
    },
    {
      description:
        "6 Sq mm X 1 Core Shakti Ground Cable (Green & Yellow) - Ground",
      qtyIn1Set: 20,
      unit: "m",
      pricePerUnitUsd: 1.38,
      sortOrder: 7,
    },
    {
      description: "Conduit Pipe (for Cable)",
      qtyIn1Set: 260,
      unit: "m",
      pricePerUnitUsd: 0.13,
      sortOrder: 8,
    },
    {
      description: 'Column pipe-32mm (1.25") std. 21kg -Short Coupler',
      qtyIn1Set: 42,
      unit: "pcs",
      pricePerUnitUsd: 5.46,
      sortOrder: 9,
    },
    {
      description: 'SS 1.25" Short Coupler Top Adopter (Heavy)',
      qtyIn1Set: 1,
      unit: "pcs",
      pricePerUnitUsd: 16.6,
      sortOrder: 10,
    },
    {
      description: 'SS 1.25" Short Coupler Bottom Adopter (Heavy)',
      qtyIn1Set: 1,
      unit: "pcs",
      pricePerUnitUsd: 14.24,
      sortOrder: 11,
    },
    {
      description: "Shakti DU/DT Filter 16A",
      qtyIn1Set: 1,
      unit: "pcs",
      pricePerUnitUsd: 162.4,
      sortOrder: 12,
    },
    {
      description: "Cable Tie",
      qtyIn1Set: 290,
      unit: "pcs",
      pricePerUnitUsd: 0.06,
      sortOrder: 13,
    },
    {
      description: "Lightening Arrestor",
      qtyIn1Set: 1,
      unit: "pcs",
      pricePerUnitUsd: 27.88,
      sortOrder: 14,
    },
    {
      description:
        "Garware Rope (12 mm) (As per 120m - depth + 10m extra)",
      qtyIn1Set: 130,
      unit: "m",
      pricePerUnitUsd: 0.29,
      sortOrder: 15,
    },
    {
      description: "Earthing Rod",
      qtyIn1Set: 2,
      unit: "pcs",
      pricePerUnitUsd: 23.24,
      sortOrder: 16,
    },
    {
      description: "Cable Joining Kit (10 sqmm)",
      qtyIn1Set: 1,
      unit: "set",
      pricePerUnitUsd: 12.31,
      sortOrder: 17,
    },
    {
      description: "Solar PV connector",
      qtyIn1Set: 8,
      unit: "pcs",
      pricePerUnitUsd: 0.76,
      sortOrder: 18,
    },
  ];

  for (const item of priceItems) {
    await prisma.priceItem.create({
      data: {
        productId: product.id,
        ...item,
      },
    });
  }

  console.log(`✅ ${priceItems.length} price items created`);

  // ─── Create Placeholder Product Images ─────────────────────────────────

  await prisma.productImage.deleteMany({
    where: { productId: product.id },
  });

  const images = [
    {
      type: ImageType.DIMENSION_PUMP,
      url: "/images/products/solar-2-dcssp-3000/dimension.jpg",
      caption: "Pump Dimension Drawing",
    },
    {
      type: ImageType.DIMENSION_CONTROLLER,
      url: "/images/products/solar-2-dcssp-3000/dimension.jpg",
      caption: "Controller Dimension Drawing",
    },
    {
      type: ImageType.LAYOUT_DIAGRAM,
      url: "/images/products/solar-2-dcssp-3000/layout.jpg",
      caption: "Installation Layout Diagram",
    },
    {
      type: ImageType.LOGO,
      url: "/images/products/solar-2-dcssp-3000/logo.png",
      caption: "JGD Company Logo",
    },
  ];

  for (const img of images) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        ...img,
      },
    });
  }

  console.log(`✅ ${images.length} placeholder images created`);

  // ─── Create Sample Quotation ───────────────────────────────────────────

  const quotation = await prisma.quotation.upsert({
    where: { refNumber: "002/JGD/VII/26" },
    update: {},
    create: {
      refNumber: "002/JGD/VII/26",
      date: new Date("2026-07-16"),
      validityDate: new Date("2026-08-15"),
      clientName: "Sample Client",
      clientCompany: "Sample Company",
      projectLocationName: "Indonesia",
      latitude: -0.79,
      longitude: 113.92,
      productId: product.id,
      numPumpsets: 6,
      paymentTerms:
        "100 % Advance Payment Or 30 % Advance Payment and 70 % Balance before Dispatch",
      shipmentSchedule: "Shipment Schedule 4 - 6 Weeks",
      status: "DRAFT",
      calculatedTotals: {
        lineItems: priceItems.map((item) => ({
          description: item.description,
          qtyIn1Set: item.qtyIn1Set,
          totalQty: item.qtyIn1Set * 6,
          pricePerUnit: item.pricePerUnitUsd,
          totalPrice:
            Math.round(item.qtyIn1Set * 6 * item.pricePerUnitUsd * 100) / 100,
        })),
        grandTotal: 19062.44,
      },
    },
  });

  console.log(`✅ Sample quotation created: ${quotation.refNumber}`);

  // ─── Create Sample Irradiation Cache ───────────────────────────────────

  await prisma.locationIrradiationCache.upsert({
    where: {
      latitude_longitude: {
        latitude: -0.79,
        longitude: 113.92,
      },
    },
    update: {},
    create: {
      latitude: -0.79,
      longitude: 113.92,
      monthlyIrradiation: {
        JAN: 4.72,
        FEB: 4.94,
        MAR: 4.85,
        APR: 4.71,
        MAY: 4.67,
        JUN: 4.6,
        JUL: 4.61,
        AUG: 5.06,
        SEP: 5.3,
        OCT: 5.16,
        NOV: 4.64,
        DEC: 4.61,
      },
      avgDailyFlowLiter: {
        JAN: 15859.2,
        FEB: 16598.4,
        MAR: 16296,
        APR: 15825.6,
        MAY: 15691.2,
        JUN: 15456,
        JUL: 15489.6,
        AUG: 17001.6,
        SEP: 17808,
        OCT: 17337.6,
        NOV: 15590.4,
        DEC: 15489.6,
      },
    },
  });

  console.log("✅ Sample irradiation cache created for (-0.79, 113.92)");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

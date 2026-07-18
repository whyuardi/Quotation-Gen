"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import "./print.css";

interface PriceItem {
  id: string;
  description: string;
  qtyIn1Set: number;
  unit: string;
  pricePerUnitUsd: string;
  sortOrder: number;
}

interface ProductImage {
  id: string;
  type: "DIMENSION_PUMP" | "DIMENSION_CONTROLLER" | "LAYOUT_DIAGRAM" | "LOGO";
  url: string;
  caption: string | null;
}

interface QuotationData {
  id: string;
  refNumber: string;
  date: string;
  validityDate: string;
  clientName: string;
  clientCompany: string | null;
  projectLocationName: string | null;
  latitude: number | null;
  longitude: number | null;
  numPumpsets: number;
  paymentTerms: string | null;
  shipmentSchedule: string | null;
  status: string;
  irradiationCache: {
    monthlyIrradiation: Record<string, number>;
    avgDailyFlowLiter: Record<string, number> | null;
  } | null;
  calculatedTotals: {
    lineItems: {
      description: string;
      qtyIn1Set: number;
      totalQty: number;
      pricePerUnit: number;
      totalPrice: number;
      unit: string;
    }[];
    grandTotal: number;
  } | null;
  product: {
    id: string;
    name: string;
    modelCode: string;
    specs: Record<string, any>;
    pumpCurveData: { head: number; points: { power_watt: number; flow_lpm: number }[] }[] | null;
    dimensionTable: {
      pump: Record<string, number>;
      controller: Record<string, number>;
    } | null;
    netWeight: {
      pump: string | number | null;
      motor: string | number | null;
      controller: string | number | null;
    } | null;
    priceItems: PriceItem[];
    images: ProductImage[];
  };
}

function CompanyHeader() {
  return (
    <div className="text-center mb-5">
      <div className="flex items-center justify-center gap-4 mb-1">
        <div className="w-[85px] h-[70px] flex items-center justify-center">
          <div className="text-3xl font-black tracking-tight" style={{
            background: "linear-gradient(180deg, #DAA520 0%, #B8860B 50%, #DAA520 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "serif",
          }}>
            JGD
          </div>
        </div>
        <div>
          <h1 className="text-[24px] font-bold tracking-wide" style={{
            background: "linear-gradient(180deg, #DAA520 0%, #B8860B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "serif",
          }}>
            JIANGYA GOLDEN DRAGON PTE. LTD.
          </h1>
        </div>
      </div>
      <div className="text-[11px] font-bold text-black leading-tight border-b border-black pb-2">
        <div>100 TRAS STREET #09-01 100AM</div>
        <div>SINGAPORE, 079027</div>
        <div>📞: +62 815-8816-259</div>
        <div>✉ : singapore@benuagreen.com, ceo@benuagreen.com</div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_KEYS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// Fallback irradiation & flow data matching seed (Indonesia location)
const fallbackIrradiation = {
  JAN: 4.72, FEB: 4.94, MAR: 4.85, APR: 4.71, MAY: 4.67, JUN: 4.60,
  JUL: 4.61, AUG: 5.06, SEP: 5.30, OCT: 5.16, NOV: 4.64, DEC: 4.61
};
const fallbackFlow = {
  JAN: 15859.2, FEB: 16598.4, MAR: 16296.0, APR: 15825.6, MAY: 15691.2, JUN: 15456.0,
  JUL: 15489.6, AUG: 17001.6, SEP: 17808.0, OCT: 17337.6, NOV: 15590.4, DEC: 15489.6
};

export default function PrintDocument({ quotation }: { quotation: QuotationData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const totals = quotation.calculatedTotals;
  const specs = quotation.product.specs || {};

  // Extract images
  const layoutImage = quotation.product.images?.find((img) => img.type === "LAYOUT_DIAGRAM")?.url || "/images/products/solar-2-dcssp-3000/layout.jpg";
  const pumpDimensionImage = quotation.product.images?.find((img) => img.type === "DIMENSION_PUMP")?.url || "/images/products/solar-2-dcssp-3000/dimension.jpg";
  const controllerDimensionImage = quotation.product.images?.find((img) => img.type === "DIMENSION_CONTROLLER")?.url || "/images/products/solar-2-dcssp-3000/dimension.jpg";

  // Process Pump Curve Chart Data
  const pumpCurve = quotation.product.pumpCurveData || [];
  const powers = Array.from(new Set(pumpCurve.flatMap((c) => c.points.map((p) => p.power_watt)))).sort((a, b) => a - b);
  const pumpCurveChartData = powers.map((p) => {
    const row: Record<string, any> = { power: p };
    pumpCurve.forEach((c) => {
      const pt = c.points.find((x) => x.power_watt === p);
      if (pt) {
        row[`flow_${c.head}`] = pt.flow_lpm;
      }
    });
    return row;
  });

  // Process Solar & Flow Chart Data
  const irrData = (quotation.irradiationCache?.monthlyIrradiation || fallbackIrradiation) as Record<string, number>;
  const flowData = (quotation.irradiationCache?.avgDailyFlowLiter || fallbackFlow) as Record<string, number>;

  const barChartData = MONTHS.map((mon, idx) => {
    const key = MONTH_KEYS[idx];
    return {
      month: mon,
      irradiation: irrData[key] || 0,
      flow: flowData[key] || 0,
    };
  });

  return (
    <div className="print-document bg-white min-h-screen text-black">
      {/* ═══════════════════════════════════════════════════════════
          PAGE 1: Quotation Pricing Table
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-page flex flex-col">
        <CompanyHeader />
        <div className="text-center mb-4">
          <h2 className="text-[18px] font-bold underline italic font-serif">QUOTATION</h2>
          <h3 className="text-[16px] font-bold mt-0.5">{quotation.product.name}</h3>
        </div>

        <div className="flex justify-end mb-4 pr-2">
          <div className="text-[11px] leading-tight">
            <div className="flex"><span className="font-bold w-16">Ref</span><span>: {quotation.refNumber}</span></div>
            <div className="flex"><span className="font-bold w-16">Date</span><span>: {formatDate(quotation.date)}</span></div>
            <div className="flex"><span className="font-bold w-16">Validity</span><span>: {formatDate(quotation.validityDate)}</span></div>
          </div>
        </div>

        {totals && (
          <div className="flex-1">
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-[#F5C14F]">
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[35px]" rowSpan={2}>No.</th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold">Description</th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[50px]">Qty</th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[75px]">Total Qty</th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[75px]" rowSpan={2}>Price/Unit<br />(USD)</th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[80px]" rowSpan={2}>Total Price<br />(USD)</th>
                </tr>
                <tr className="bg-[#F5C14F]">
                  <th className="border border-black px-2 py-1 text-center font-bold text-[9px]">In 1 Set</th>
                  <th className="border border-black px-2 py-1 text-center font-bold text-[9px]">{quotation.numPumpsets} Pumpsets</th>
                </tr>
              </thead>
              <tbody>
                {totals.lineItems.map((item, index) => (
                  <tr key={index}>
                    {index === 0 && (
                      <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={totals.lineItems.length}>1</td>
                    )}
                    <td className="border border-black px-2 py-1.5 align-top whitespace-pre-line leading-tight text-[9.5px] font-sans">
                      {item.description}
                    </td>
                    <td className="border border-black px-2 py-1 text-center align-middle">{item.qtyIn1Set}</td>
                    <td className="border border-black px-2 py-1 text-center align-middle">{item.totalQty}</td>
                    <td className="border border-black px-2 py-1 text-right align-middle">{formatCurrency(item.pricePerUnit)}</td>
                    <td className="border border-black px-2 py-1 text-right align-middle">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F5C14F] font-bold">
                  <td colSpan={5} className="border border-black px-2 py-2 text-center text-[10.5px]">
                    Total USD {quotation.numPumpsets} Sets Ex-works
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-[11.5px]">{formatCurrency(totals.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2: Notes + Payment Transfer Detail
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-page flex flex-col">
        <CompanyHeader />
        <div className="mx-2 mb-10 mt-4">
          <h3 className="text-[12px] font-bold mb-2 underline font-serif">Note :</h3>
          <ol className="list-decimal list-inside text-[11px] space-y-1.5 pl-2">
            <li>Packing In Corrugated/Wooden Boxes</li>
            <li>{quotation.shipmentSchedule || "Shipment Schedule 4 - 6 Weeks"}</li>
            <li>{quotation.paymentTerms || "100 % Advance Payment Or 30 % Advance Payment and 70 % Balance before Dispatch"}</li>
          </ol>
        </div>

        <div className="mx-2 flex-1">
          <h3 className="text-[12px] font-bold mb-3 font-serif">PAYMENT TRANSFER DETAIL</h3>
          <table className="w-full max-w-[550px] border-collapse border border-black text-[11px]">
            <tbody>
              {[
                ["Beneficiary Name", "JIANGYA GOLDEN DRAGON PTE LTD."],
                ["Beneficiary Bank", "United Overseas Bank Limited, Singapore"],
                ["Bank Branch", "UOB Toa Payoh Branch"],
                ["Bank Address", "396 Alexandra Road 17-00 Singapore 119954"],
                ["SWIFT BIC.", "UOVBSGSG"],
                ["Account No.", "355-306-289-4"],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="border border-black px-3 py-2.5 font-bold w-[180px] bg-zinc-50">{label}</td>
                  <td className="border border-black px-3 py-2.5">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3: Technical Datasheet
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-page flex flex-col">
        <CompanyHeader />

        {/* Offer & Customer table */}
        <div className="mx-2 mb-4">
          <table className="w-full border-collapse border border-black text-[10px]">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1.5 w-[50%]"><span className="font-bold">Offer No.</span>: {quotation.refNumber}</td>
                <td className="border border-black px-2 py-1.5"><span className="font-bold">Offer Date</span>: {formatDate(quotation.date)}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5"><span className="font-bold">Customer</span>: {quotation.clientName} {quotation.clientCompany ? `(${quotation.clientCompany})` : ""}</td>
                <td className="border border-black px-2 py-1.5"><span className="font-bold">Enq. & Dt.</span>: </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5"><span className="font-bold">Project</span>: {quotation.projectLocationName || "Solar Pumping System"}</td>
                <td className="border border-black px-2 py-1.5"><span className="font-bold">End User</span>: </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5 font-sans" colSpan={2}>
                  <div className="grid grid-cols-2 gap-y-1 py-1">
                    <div><span className="font-bold">Tag No #</span>: NA</div>
                    <div><span className="font-bold">City/State</span>: {quotation.projectLocationName || "NA"}</div>
                    <div><span className="font-bold">Total Dynamic Head</span>: {specs.head_range || "120"} m</div>
                    <div><span className="font-bold">Country</span>: Indonesia</div>
                    <div><span className="font-bold">Flow</span>: {specs.flow_lpm || "56"} LPM</div>
                    <div><span className="font-bold">Latitude / Longitude</span>: {quotation.latitude ?? "NA"} / {quotation.longitude ?? "NA"}</div>
                    <div><span className="font-bold">Daily Avg. Flow</span>: {Math.round(Object.values(flowData).reduce((a, b) => a + b, 0) / 12)} Liter</div>
                    <div><span className="font-bold">Daily Avg. Flow Max</span>: {Math.max(...Object.values(flowData))} Liter</div>
                    <div><span className="font-bold">Daily Avg. Flow Min</span>: {Math.min(...Object.values(flowData))} Liter</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-center my-3">
          <h2 className="text-[14px] font-bold underline font-serif">Technical Datasheet</h2>
        </div>

        {/* Component summary */}
        <div className="mx-2 mb-4">
          <h4 className="text-[11px] font-bold mb-1 border-b border-black pb-0.5">Products</h4>
          <table className="w-full text-left text-[10px] leading-tight">
            <thead>
              <tr className="border-b border-black">
                <th className="pb-1">Item</th>
                <th className="pb-1">Description</th>
                <th className="pb-1 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1 font-bold">Pump</td>
                <td className="py-1">{quotation.product.name}</td>
                <td className="py-1 text-right">1 Nos</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 font-bold">Motor</td>
                <td className="py-1">Motor {specs.motor_power_hp || "3"} HP / {specs.motor_power_kw || "2.2"} kW</td>
                <td className="py-1 text-right">1 Nos</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1 font-bold">Controller</td>
                <td className="py-1">{specs.controller_name || "Controller / Drive"}</td>
                <td className="py-1 text-right">1 Nos</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed specifications */}
        <div className="mx-2 flex-1 text-[9.5px] leading-tight space-y-4">
          {/* Pump specs */}
          <div>
            <h4 className="font-bold border-b border-black pb-0.5 uppercase mb-1">{quotation.product.name}</h4>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Premium materials, stainless steel: AISI 304</li>
              <li>Impeller: {specs.impeller || "SS 304"} | Shaft: {specs.shaft || "Duplex"} | Casing: {specs.casing || "SS 304"}</li>
              <li>Pump Outlet: {specs.pump_outlet || "BSP 32 MM"} | Max Water Temp: {specs.max_water_temp || "40°C"}</li>
              <li>Pumpset Code: {specs.pumpset_code || "NA"} | Order Code: {specs.order_code || "NA"}</li>
            </ul>
          </div>

          {/* Motor specs */}
          <div>
            <h4 className="font-bold border-b border-black pb-0.5 uppercase mb-1">Motor {specs.motor_code || ""}</h4>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>{specs.motor_type || "Water filled permanent magnet motor"}</li>
              <li>Motor Power: {specs.motor_power_kw || "2.2"} kW ({specs.motor_power_hp || "3"} HP)</li>
              <li>Motor Speed: {specs.motor_speed_range || "1000 - 3600 RPM"} | Efficiency: {specs.motor_efficiency || "86%"}</li>
              <li>Enclosure Class: {specs.motor_enclosure_class || "IP68"}</li>
            </ul>
          </div>

          {/* Controller specs */}
          <div>
            <h4 className="font-bold border-b border-black pb-0.5 uppercase mb-1">Controller {specs.controller_name || ""}</h4>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Integrated MPPT (Maximum Power Point Tracking)</li>
              <li>Input Voltage: {specs.controller_input_voltage || "Max. 450 V"} | Min. Voltage: {specs.controller_min_voltage || "30 V"}</li>
              <li>Max Efficiency: {specs.controller_max_eff || "93%"} | Current: {specs.controller_current || "15 A"}</li>
              <li>Enclosure Class: {specs.controller_enclosure_class || "IP 65"} | Ambient Temp: {specs.controller_ambient_temp || "-20 to 70°C"}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 4: Charts
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-page flex flex-col">
        <CompanyHeader />

        <div className="flex-1 space-y-6 flex flex-col justify-center items-center">
          {/* Chart 1: Pump Curve */}
          <div className="w-[680px]">
            <h4 className="text-[11px] font-bold text-center mb-1 text-zinc-700">Pump Performance Curve ({quotation.product.name})</h4>
            {mounted ? (
              <LineChart width={680} height={180} data={pumpCurveChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="power" label={{ value: "Power (Watt)", position: "insideBottom", offset: -2, fontSize: 9 }} tick={{ fontSize: 8 }} />
                <YAxis label={{ value: "Flow (LPM)", angle: -90, position: "insideLeft", fontSize: 9 }} tick={{ fontSize: 8 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                {pumpCurve.map((curve, idx) => {
                  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
                  return (
                    <Line
                      key={curve.head}
                      type="monotone"
                      dataKey={`flow_${curve.head}`}
                      name={`${curve.head}m Head`}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  );
                })}
              </LineChart>
            ) : (
              <div className="w-[680px] h-[180px] bg-zinc-50 border border-dashed flex items-center justify-center text-xs text-zinc-400">Loading curve chart...</div>
            )}
          </div>

          {/* Chart 2: Volume per Day */}
          <div className="w-[680px]">
            <h4 className="text-[11px] font-bold text-center mb-1 text-zinc-700">Average Volume Per Day (Liters)</h4>
            {mounted ? (
              <BarChart width={680} height={150} data={barChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip />
                <Bar dataKey="flow" name="Volume (Liter)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <div className="w-[680px] h-[150px] bg-zinc-50 border border-dashed flex items-center justify-center text-xs text-zinc-400">Loading volume chart...</div>
            )}
          </div>

          {/* Chart 3: Solar Irradiation */}
          <div className="w-[680px]">
            <h4 className="text-[11px] font-bold text-center mb-1 text-zinc-700">Solar Irradiation Data (kWh/m²/day)</h4>
            {mounted ? (
              <BarChart width={680} height={150} data={barChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip />
                <Bar dataKey="irradiation" name="Irradiation" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <div className="w-[680px] h-[150px] bg-zinc-50 border border-dashed flex items-center justify-center text-xs text-zinc-400">Loading irradiation chart...</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 5: Dimension / Weight
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-page flex flex-col">
        <CompanyHeader />
        <div className="text-center mb-4">
          <h2 className="text-[14px] font-bold underline font-serif">Dimension & Weight Specifications</h2>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-4 mx-2">
          {/* Left Side: Images */}
          <div className="col-span-6 flex flex-col justify-around border-r border-zinc-200 pr-4">
            <div>
              <h4 className="text-[11px] font-bold mb-2 uppercase text-zinc-600 tracking-wider">Pump Drawings</h4>
              <div className="w-full h-[200px] relative overflow-hidden bg-white flex items-center justify-center border border-zinc-100 rounded-lg">
                <img
                  src={pumpDimensionImage}
                  alt="Pump Dimensions"
                  className="max-w-[95%] max-h-[95%] object-contain"
                />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-[11px] font-bold mb-2 uppercase text-zinc-600 tracking-wider">Controller Drawings</h4>
              <div className="w-full h-[200px] relative overflow-hidden bg-white flex items-center justify-center border border-zinc-100 rounded-lg">
                <img
                  src={controllerDimensionImage}
                  alt="Controller Dimensions"
                  className="max-w-[95%] max-h-[95%] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Dimension Tables */}
          <div className="col-span-6 flex flex-col justify-around pl-2 space-y-4">
            <div>
              <h4 className="text-[11px] font-bold mb-1.5 text-zinc-700">Pump Parameters (mm)</h4>
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-zinc-100 font-bold">
                    <th className="border border-black px-2 py-1">Parameter</th>
                    <th className="border border-black px-2 py-1 text-right">Value (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {["A", "B", "C", "D", "E", "Rp"].map((key) => (
                    <tr key={key}>
                      <td className="border border-black px-2 py-1 font-semibold">{key}</td>
                      <td className="border border-black px-2 py-1 text-right">
                        {quotation.product.dimensionTable?.pump?.[key] ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="text-[11px] font-bold mb-1.5 text-zinc-700">Controller Parameters (mm)</h4>
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-zinc-100 font-bold">
                    <th className="border border-black px-2 py-1">Parameter</th>
                    <th className="border border-black px-2 py-1 text-right">Value (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {["A", "B", "C", "D", "E", "F", "G"].map((key) => (
                    <tr key={key}>
                      <td className="border border-black px-2 py-1 font-semibold">{key}</td>
                      <td className="border border-black px-2 py-1 text-right">
                        {quotation.product.dimensionTable?.controller?.[key] ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Weight Table (Bottom) */}
        <div className="mx-2 mt-4 pb-2 border-t border-zinc-200 pt-4">
          <h4 className="text-[11px] font-bold mb-1.5 text-zinc-700">Net Weight Specifications</h4>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-zinc-100 font-bold">
                <th className="border border-black px-3 py-1.5 text-left">Item</th>
                <th className="border border-black px-3 py-1.5 text-right w-[150px]">Net Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5">Pump Unit</td>
                <td className="border border-black px-3 py-1.5 text-right">{quotation.product.netWeight?.pump ?? "NA"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5">Motor Unit</td>
                <td className="border border-black px-3 py-1.5 text-right">{quotation.product.netWeight?.motor ?? "NA"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5">Solar Controller Drive</td>
                <td className="border border-black px-3 py-1.5 text-right">{quotation.product.netWeight?.controller ?? "NA"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 6: Installation Layout Diagram
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-page flex flex-col">
        <CompanyHeader />
        <div className="text-center mb-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wider font-serif">Shakti Solar Pumping System Layout</h2>
        </div>

        {/* Layout Diagram */}
        <div className="flex-1 flex flex-col items-center justify-center my-2">
          <div className="max-w-[95%] max-h-[460px] border border-zinc-200 rounded-xl overflow-hidden bg-white p-2">
            <img
              src={layoutImage}
              alt="Installation Layout Diagram"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Legend table from Page 6 Reference Image */}
        <div className="mx-4 mt-2 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-zinc-200 pt-4 text-[10px] leading-relaxed">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">1</span>
            <span className="font-semibold text-zinc-700">SOLAR PV PANEL</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">2</span>
            <span className="font-semibold text-zinc-700">SOLAR PV PANEL MOUNTING STRUCTURE</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">3</span>
            <span className="font-semibold text-zinc-700">SOLAR CONTROLLER</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">4</span>
            <span className="font-semibold text-zinc-700">SOLAR PUMPSET</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">5</span>
            <span className="font-semibold text-zinc-700">DC CABLE</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">6</span>
            <span className="font-semibold text-zinc-700">AC CABLE</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">7</span>
            <span className="font-semibold text-zinc-700">EARTHING ROD</span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100 font-bold border border-zinc-400">8</span>
            <span className="font-semibold text-zinc-700">RISING PIPE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

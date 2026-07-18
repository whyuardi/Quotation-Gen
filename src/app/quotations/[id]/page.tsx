"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

interface QuotationDetail {
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
  calculatedTotals: {
    lineItems: {
      description: string;
      qtyIn1Set: number;
      totalQty: number;
      pricePerUnit: number;
      totalPrice: number;
    }[];
    grandTotal: number;
  } | null;
  product: {
    id: string;
    name: string;
    modelCode: string;
  };
}

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then((res) => res.json())
      .then(setQuotation)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const fmtUsd = (v: number) =>
    v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!quotation) {
    return (
      <AppShell>
        <p className="text-zinc-500 text-center py-20">Quotation not found</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl">
        {/* Breadcrumb + Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[13px]">
            <Link href="/quotations" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Quotations
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 font-mono">{quotation.refNumber}</span>
            <span className={`ml-2 inline-block px-2 py-0.5 text-[11px] font-medium rounded ${
              quotation.status === "ACCEPTED" ? "text-emerald-300 bg-emerald-950/60" :
              quotation.status === "SENT" ? "text-blue-300 bg-blue-950/60" :
              "text-zinc-400 bg-zinc-800"
            }`}>
              {quotation.status}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/quotations/${quotation.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print
            </Link>
            <a
              href={`/api/quotations/${quotation.id}/pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-[#c8a44e] hover:bg-[#d4b65c] text-white rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-px bg-zinc-800/50 border border-zinc-800/80 rounded-xl overflow-hidden mb-6">
          <div className="bg-zinc-950 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Quotation</p>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between"><span className="text-zinc-500">Date</span><span className="text-zinc-200 tabular-nums">{fmtDate(quotation.date)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Valid</span><span className="text-zinc-200 tabular-nums">{fmtDate(quotation.validityDate)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Sets</span><span className="text-zinc-200">{quotation.numPumpsets}</span></div>
            </div>
          </div>
          <div className="bg-zinc-950 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Client</p>
            <p className="text-[13px] text-zinc-200 font-medium">{quotation.clientName}</p>
            {quotation.clientCompany && <p className="text-[13px] text-zinc-500">{quotation.clientCompany}</p>}
            {quotation.projectLocationName && <p className="text-[13px] text-zinc-500">{quotation.projectLocationName}</p>}
            {quotation.latitude && quotation.longitude && (
              <p className="text-[11px] text-zinc-600 font-mono mt-1">{quotation.latitude}, {quotation.longitude}</p>
            )}
          </div>
          <div className="bg-zinc-950 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Total</p>
            <p className="text-2xl font-semibold text-zinc-100 tabular-nums">
              ${quotation.calculatedTotals ? fmtUsd(quotation.calculatedTotals.grandTotal) : "—"}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5">USD Ex-works · {quotation.product.modelCode}</p>
          </div>
        </div>

        {/* Pricing Table */}
        {quotation.calculatedTotals && (
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40">
              <h3 className="text-[13px] font-medium text-zinc-400">Itemized Pricing</h3>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-zinc-500 w-8">#</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-zinc-500">Description</th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-zinc-500">Qty/Set</th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-zinc-500">Total Qty</th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-zinc-500">Price/Unit</th>
                  <th className="px-4 py-2 text-right text-[11px] font-medium text-zinc-500">Total (USD)</th>
                </tr>
              </thead>
              <tbody>
                {quotation.calculatedTotals.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-zinc-800/30 hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-2 text-zinc-600">{i + 1}</td>
                    <td className="px-3 py-2 text-zinc-300">{item.description.split("\n")[0]}</td>
                    <td className="px-3 py-2 text-right text-zinc-400 tabular-nums">{item.qtyIn1Set}</td>
                    <td className="px-3 py-2 text-right text-zinc-400 tabular-nums">{item.totalQty}</td>
                    <td className="px-3 py-2 text-right text-zinc-400 tabular-nums">{fmtUsd(item.pricePerUnit)}</td>
                    <td className="px-4 py-2 text-right text-zinc-200 font-mono tabular-nums">{fmtUsd(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-900/60">
                  <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-semibold text-zinc-100 font-mono tabular-nums">
                    {fmtUsd(quotation.calculatedTotals.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

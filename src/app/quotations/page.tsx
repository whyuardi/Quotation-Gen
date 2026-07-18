"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

interface Quotation {
  id: string;
  refNumber: string;
  date: string;
  validityDate: string;
  clientName: string;
  clientCompany: string | null;
  projectLocationName: string | null;
  numPumpsets: number;
  status: "DRAFT" | "SENT" | "ACCEPTED";
  product: { id: string; name: string; modelCode: string };
  calculatedTotals: { grandTotal: number } | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  DRAFT: { label: "Draft", class: "text-zinc-400 bg-zinc-800" },
  SENT: { label: "Sent", class: "text-blue-300 bg-blue-950/60" },
  ACCEPTED: { label: "Accepted", class: "text-emerald-300 bg-emerald-950/60" },
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quotations")
      .then((res) => res.json())
      .then(setQuotations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, ref: string) => {
    if (!confirm(`Hapus quotation "${ref}"?`)) return;
    try {
      await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      setQuotations((prev) => prev.filter((q) => q.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const fmtUsd = (v: number) =>
    v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <AppShell>
      <div>
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Quotations</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">
              {quotations.length > 0 ? `${quotations.length} quotation${quotations.length > 1 ? "s" : ""}` : "No quotations yet"}
            </p>
          </div>
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#c8a44e] hover:bg-[#d4b65c] text-white text-[13px] font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Quotation
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && quotations.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm mb-4">Belum ada quotation.</p>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#c8a44e] border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
            >
              Buat Quotation Pertama
            </Link>
          </div>
        )}

        {/* Quotation Table */}
        {!loading && quotations.length > 0 && (
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/50">
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Ref</th>
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Client</th>
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Product</th>
                  <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">Sets</th>
                  <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">Total (USD)</th>
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Date</th>
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Status</th>
                  <th className="w-24 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  const st = statusConfig[q.status] || statusConfig.DRAFT;
                  return (
                    <tr key={q.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/60 transition-colors group">
                      <td className="px-4 py-3">
                        <Link href={`/quotations/${q.id}`} className="font-mono text-zinc-200 hover:text-white">
                          {q.refNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {q.clientName}
                        {q.clientCompany && <span className="text-zinc-600 ml-1">({q.clientCompany})</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{q.product.modelCode}</td>
                      <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{q.numPumpsets}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-200 tabular-nums">
                        {q.calculatedTotals ? fmtUsd(q.calculatedTotals.grandTotal) : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 tabular-nums">{fmtDate(q.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded ${st.class}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/quotations/${q.id}/print`}
                            target="_blank"
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                            title="Print"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/quotations/${q.id}`}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                            title="View"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(q.id, q.refNumber)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

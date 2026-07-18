"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

interface Product {
  id: string;
  name: string;
  modelCode: string;
}

interface CalculatedLineItem {
  description: string;
  qtyIn1Set: number;
  totalQty: number;
  pricePerUnit: number;
  totalPrice: number;
  unit: string;
}

interface QuotationCalculation {
  lineItems: CalculatedLineItem[];
  grandTotal: number;
  numPumpsets: number;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [productId, setProductId] = useState("");
  const [numPumpsets, setNumPumpsets] = useState(1);
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [projectLocationName, setProjectLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(
    "100 % Advance Payment Or 30 % Advance Payment and 70 % Balance before Dispatch"
  );
  const [shipmentSchedule, setShipmentSchedule] = useState(
    "Shipment Schedule 4 - 6 Weeks"
  );

  // Live calculation
  const [calculation, setCalculation] = useState<QuotationCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        if (data.length > 0) setProductId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const calculateTotals = useCallback(async () => {
    if (!productId || numPumpsets < 1) return;
    setCalculating(true);
    try {
      const res = await fetch("/api/quotations/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, numPumpsets }),
      });
      if (res.ok) setCalculation(await res.json());
    } catch (err) {
      console.error("Calculation error:", err);
    } finally {
      setCalculating(false);
    }
  }, [productId, numPumpsets]);

  useEffect(() => {
    const t = setTimeout(calculateTotals, 300);
    return () => clearTimeout(t);
  }, [calculateTotals]);

  const fmtUsd = (v: number) =>
    v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          numPumpsets,
          clientName,
          clientCompany,
          projectLocationName,
          latitude: latitude || null,
          longitude: longitude || null,
          paymentTerms,
          shipmentSchedule,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create quotation");
      }

      const quotation = await res.json();
      router.push(`/quotations/${quotation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const inputClass = "w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors";
  const labelClass = "block text-[12px] text-zinc-500 mb-1";

  return (
    <AppShell>
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] mb-6">
          <button onClick={() => router.push("/quotations")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Quotations
          </button>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-200">New</span>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-950/40 border border-red-900/40 rounded-lg text-red-400 text-[13px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="col-span-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product & Quantity */}
              <fieldset className="space-y-3">
                <legend className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Product & Quantity</legend>
                <div>
                  <label className={labelClass}>Product *</label>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass} required>
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Number of Pumpsets *</label>
                  <input
                    type="number"
                    value={numPumpsets}
                    onChange={(e) => setNumPumpsets(Math.max(1, Number(e.target.value)))}
                    className={inputClass}
                    min={1}
                    required
                  />
                </div>
              </fieldset>

              {/* Client */}
              <fieldset className="space-y-3">
                <legend className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Client</legend>
                <div>
                  <label className={labelClass}>Name *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Company</label>
                  <input type="text" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className={inputClass} />
                </div>
              </fieldset>

              {/* Location */}
              <fieldset className="space-y-3">
                <legend className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Project Location</legend>
                <div>
                  <label className={labelClass}>Location name</label>
                  <input type="text" value={projectLocationName} onChange={(e) => setProjectLocationName(e.target.value)} className={inputClass} placeholder="e.g. Indonesia" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Latitude</label>
                    <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputClass} placeholder="-0.79" />
                  </div>
                  <div>
                    <label className={labelClass}>Longitude</label>
                    <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputClass} placeholder="113.92" />
                  </div>
                </div>
              </fieldset>

              {/* Terms */}
              <fieldset className="space-y-3">
                <legend className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Terms</legend>
                <div>
                  <label className={labelClass}>Payment terms</label>
                  <textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={`${inputClass} resize-none`} rows={2} />
                </div>
                <div>
                  <label className={labelClass}>Shipment schedule</label>
                  <textarea value={shipmentSchedule} onChange={(e) => setShipmentSchedule(e.target.value)} className={`${inputClass} resize-none`} rows={2} />
                </div>
              </fieldset>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#c8a44e] hover:bg-[#d4b65c] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create Quotation"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/quotations")}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-[13px] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Preview */}
          <div className="col-span-7">
            <div className="sticky top-8">
              <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
                  <h2 className="text-[13px] font-medium text-zinc-400">Price Preview</h2>
                  {calculating && (
                    <div className="w-3.5 h-3.5 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                  )}
                </div>

                {!calculation ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-zinc-600 text-[13px]">Select a product to see pricing</p>
                  </div>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-zinc-800/60">
                        <th className="px-4 py-2 text-left text-[11px] font-medium text-zinc-500 w-[40%]">Description</th>
                        <th className="px-2 py-2 text-right text-[11px] font-medium text-zinc-500">Qty/Set</th>
                        <th className="px-2 py-2 text-right text-[11px] font-medium text-zinc-500">Total</th>
                        <th className="px-2 py-2 text-right text-[11px] font-medium text-zinc-500">Unit Price</th>
                        <th className="px-4 py-2 text-right text-[11px] font-medium text-zinc-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.lineItems.map((item, i) => (
                        <tr key={i} className="border-b border-zinc-800/30">
                          <td className="px-4 py-2 text-zinc-300">{item.description.split("\n")[0]}</td>
                          <td className="px-2 py-2 text-right text-zinc-500 tabular-nums">{item.qtyIn1Set}</td>
                          <td className="px-2 py-2 text-right text-zinc-500 tabular-nums">{item.totalQty}</td>
                          <td className="px-2 py-2 text-right text-zinc-500 tabular-nums">{fmtUsd(item.pricePerUnit)}</td>
                          <td className="px-4 py-2 text-right text-zinc-200 font-mono tabular-nums">{fmtUsd(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-900/60">
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                          {numPumpsets} set{numPumpsets > 1 ? "s" : ""} · Ex-works
                        </td>
                        <td className="px-4 py-3 text-right text-base font-semibold text-zinc-100 font-mono tabular-nums">
                          {fmtUsd(calculation.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  modelCode: string;
  specs: Record<string, unknown>;
  _count: { quotations: number; images: number };
  priceItems: { id: string; description: string; pricePerUnitUsd: string }[];
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"? Tidak bisa di-undo.`)) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Products</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {products.length > 0 ? `${products.length} product${products.length > 1 ? "s" : ""}` : "No products yet"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#c8a44e] hover:bg-[#d4b65c] text-white text-[13px] font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-sm mb-4">Belum ada produk.</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#c8a44e] border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
          >
            Tambah Produk Pertama
          </Link>
        </div>
      )}

      {/* Product Table */}
      {!loading && products.length > 0 && (
        <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[700px] md:min-w-0">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/50">
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Product</th>
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Model</th>
                  <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">BOM Items</th>
                  <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">Quotations</th>
                  <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">PV / Motor</th>
                  <th className="w-20 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/60 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-zinc-200 hover:text-white font-medium">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-zinc-500">{p.modelCode}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{p.priceItems.length}</td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{p._count.quotations}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {p.specs && (
                        <>
                          {String((p.specs as Record<string, unknown>).pv_watt)}W ·{" "}
                          {String((p.specs as Record<string, unknown>).motor_power_kw)}kW
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

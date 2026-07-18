"use client";

import { useEffect, useState, use } from "react";
import ProductForm from "@/components/forms/ProductForm";

interface ProductData {
  id: string;
  name: string;
  modelCode: string;
  specs: Record<string, unknown>;
  pumpCurveData: unknown[];
  dimensionTable: Record<string, Record<string, number>>;
  netWeight: Record<string, unknown>;
  priceItems: {
    description: string;
    qtyIn1Set: number;
    unit: string;
    pricePerUnitUsd: string;
    sortOrder: number;
  }[];
  images: {
    type: string;
    url: string;
    caption: string | null;
  }[];
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error || "Product not found"}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Edit Product</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">{product.name}</p>
      </div>
      <ProductForm
        mode="edit"
        initialData={{
          id: product.id,
          name: product.name,
          modelCode: product.modelCode,
          specs: product.specs,
          pumpCurveData: product.pumpCurveData,
          dimensionTable: product.dimensionTable,
          netWeight: product.netWeight as Record<string, string>,
          priceItems: product.priceItems.map((item) => ({
            ...item,
            pricePerUnitUsd: parseFloat(item.pricePerUnitUsd),
          })),
          images: product.images.map((img) => ({
            type: img.type,
            url: img.url,
            caption: img.caption || "",
          })),
        }}
      />
    </div>
  );
}

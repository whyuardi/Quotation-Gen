import ProductForm from "@/components/forms/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">New Product</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          Add a solar pump model with specs and BOM pricing
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}

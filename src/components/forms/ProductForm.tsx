"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PriceItemForm {
  description: string;
  qtyIn1Set: number;
  unit: string;
  pricePerUnitUsd: number;
  sortOrder: number;
}

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    modelCode: string;
    specs: Record<string, unknown>;
    pumpCurveData?: unknown[];
    dimensionTable?: Record<string, Record<string, number>>;
    netWeight?: Record<string, unknown>;
    priceItems?: PriceItemForm[];
    images?: { type: string; url: string; caption?: string }[];
  };
  mode: "create" | "edit";
}

const defaultSpecs = {
  head_range: "",
  flow_lpm: 0,
  discharge: "",
  suction_size_mm: "",
  delivery_size_mm: 0,
  pv_watt: 0,
  pump_outlet: "",
  joining: "",
  impeller: "",
  shaft: "",
  casing: "",
  max_water_temp: "",
  pumpset_code: "",
  order_code: "",
  motor_power_kw: 0,
  motor_power_hp: 0,
  motor_speed_range: "",
  motor_efficiency: "",
  motor_enclosure_class: "",
  motor_code: "",
  motor_type: "",
  controller_name: "",
  controller_input_voltage: "",
  controller_min_voltage: "",
  controller_max_eff: "",
  controller_current: "",
  controller_enclosure_class: "",
  controller_ambient_temp: "",
};

export default function ProductForm({ initialData, mode }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialData?.name || "");
  const [modelCode, setModelCode] = useState(initialData?.modelCode || "");
  const [specs, setSpecs] = useState<Record<string, unknown>>(
    initialData?.specs || defaultSpecs
  );
  const [priceItems, setPriceItems] = useState<PriceItemForm[]>(
    initialData?.priceItems || []
  );

  // Dimension table
  const [pumpDims, setPumpDims] = useState<Record<string, number>>(
    (initialData?.dimensionTable as Record<string, Record<string, number>>)?.pump || {}
  );
  const [controllerDims, setControllerDims] = useState<Record<string, number>>(
    (initialData?.dimensionTable as Record<string, Record<string, number>>)?.controller || {}
  );

  // Net weight
  const [netWeight, setNetWeight] = useState<Record<string, string>>(
    (initialData?.netWeight as Record<string, string>) || { pump: "", motor: "", controller: "" }
  );

  // Drawing URLs
  const [dimensionPumpUrl, setDimensionPumpUrl] = useState(
    initialData?.images?.find((img) => img.type === "DIMENSION_PUMP")?.url || ""
  );
  const [dimensionControllerUrl, setDimensionControllerUrl] = useState(
    initialData?.images?.find((img) => img.type === "DIMENSION_CONTROLLER")?.url || ""
  );
  const [layoutDiagramUrl, setLayoutDiagramUrl] = useState(
    initialData?.images?.find((img) => img.type === "LAYOUT_DIAGRAM")?.url || ""
  );

  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();

      if (type === "DIMENSION_PUMP") setDimensionPumpUrl(data.url);
      if (type === "DIMENSION_CONTROLLER") setDimensionControllerUrl(data.url);
      if (type === "LAYOUT_DIAGRAM") setLayoutDiagramUrl(data.url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const updateSpec = (key: string, value: unknown) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const addPriceItem = () => {
    setPriceItems((prev) => [
      ...prev,
      {
        description: "",
        qtyIn1Set: 1,
        unit: "pcs",
        pricePerUnitUsd: 0,
        sortOrder: prev.length,
      },
    ]);
  };

  const updatePriceItem = (
    index: number,
    field: keyof PriceItemForm,
    value: string | number
  ) => {
    setPriceItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removePriceItem = (index: number) => {
    setPriceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name,
        modelCode,
        specs,
        pumpCurveData: initialData?.pumpCurveData || [],
        dimensionTable: { pump: pumpDims, controller: controllerDims },
        netWeight,
        priceItems: priceItems.map((item, i) => ({
          ...item,
          sortOrder: i,
        })),
        images: [
          ...(dimensionPumpUrl ? [{ type: "DIMENSION_PUMP", url: dimensionPumpUrl, caption: "Pump Dimension Drawing" }] : []),
          ...(dimensionControllerUrl ? [{ type: "DIMENSION_CONTROLLER", url: dimensionControllerUrl, caption: "Controller Dimension Drawing" }] : []),
          ...(layoutDiagramUrl ? [{ type: "LAYOUT_DIAGRAM", url: layoutDiagramUrl, caption: "Installation Layout Diagram" }] : []),
        ],
      };

      const url =
        mode === "create"
          ? "/api/products"
          : `/api/products/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="px-3 py-2 bg-red-950/40 border border-red-900/40 rounded-lg text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {/* ─── Basic Info ────────────────────────────────────────────── */}
      <section className="border border-zinc-800/80 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Basic Info
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all text-sm"
              placeholder="e.g. SOLAR 2 DCSSP 3000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Model Code *
            </label>
            <input
              type="text"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all text-sm"
              placeholder="e.g. SOLAR-2-DCSSP-3000"
              required
            />
          </div>
        </div>
      </section>

      {/* ─── Specifications ────────────────────────────────────────── */}
      <section className="border border-zinc-800/80 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Specifications
        </h2>

        {/* Pump */}
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">Pump</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: "head_range", label: "Head Range (M)", placeholder: "60-138" },
            { key: "flow_lpm", label: "Flow (LPM)", type: "number" },
            { key: "discharge", label: "Discharge (LPM)", placeholder: "86-50" },
            { key: "suction_size_mm", label: "Suction Size", placeholder: '4"x4"' },
            { key: "delivery_size_mm", label: "Delivery Size (mm)", type: "number" },
            { key: "pv_watt", label: "PV Watt", type: "number" },
            { key: "pump_outlet", label: "Pump Outlet" },
            { key: "joining", label: "Joining" },
            { key: "impeller", label: "Impeller Material" },
            { key: "shaft", label: "Shaft Material" },
            { key: "casing", label: "Casing Material" },
            { key: "max_water_temp", label: "Max Water Temp" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input
                type={type || "text"}
                value={(specs[key] as string | number) ?? ""}
                onChange={(e) =>
                  updateSpec(key, type === "number" ? Number(e.target.value) : e.target.value)
                }
                className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        {/* Motor */}
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">Motor</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: "motor_power_kw", label: "Power (kW)", type: "number" },
            { key: "motor_power_hp", label: "Power (HP)", type: "number" },
            { key: "motor_speed_range", label: "Speed Range" },
            { key: "motor_efficiency", label: "Efficiency" },
            { key: "motor_enclosure_class", label: "Enclosure Class" },
            { key: "motor_code", label: "Motor Code" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input
                type={type || "text"}
                value={(specs[key] as string | number) ?? ""}
                onChange={(e) =>
                  updateSpec(key, type === "number" ? Number(e.target.value) : e.target.value)
                }
                className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          ))}
        </div>

        {/* Controller */}
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">Controller</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "controller_name", label: "Name" },
            { key: "controller_input_voltage", label: "Input Voltage" },
            { key: "controller_min_voltage", label: "Min Voltage" },
            { key: "controller_max_eff", label: "Max Efficiency" },
            { key: "controller_current", label: "Current" },
            { key: "controller_enclosure_class", label: "Enclosure Class" },
            { key: "controller_ambient_temp", label: "Ambient Temp" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input
                type="text"
                value={(specs[key] as string) ?? ""}
                onChange={(e) => updateSpec(key, e.target.value)}
                className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Dimensions & Weight ───────────────────────────────────── */}
      <section className="border border-zinc-800/80 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          Dimensions & Weight
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Pump Dimensions (mm)</h3>
            <div className="grid grid-cols-3 gap-2">
              {["A", "B", "C", "D", "E", "Rp"].map((key) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-400 mb-1">{key}</label>
                  <input
                    type="number"
                    value={pumpDims[key] ?? ""}
                    onChange={(e) =>
                      setPumpDims((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Controller Dimensions (mm)</h3>
            <div className="grid grid-cols-3 gap-2">
              {["A", "B", "C", "D", "E", "F", "G"].map((key) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-400 mb-1">{key}</label>
                  <input
                    type="number"
                    value={controllerDims[key] ?? ""}
                    onChange={(e) =>
                      setControllerDims((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Net Weight (kg)</h3>
          <div className="grid grid-cols-3 gap-3">
            {["pump", "motor", "controller"].map((key) => (
              <div key={key}>
                <label className="block text-xs text-zinc-400 mb-1 capitalize">{key}</label>
                <input
                  type="text"
                  value={netWeight[key] ?? ""}
                  onChange={(e) =>
                    setNetWeight((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                  placeholder="e.g. 12.5 or NA"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Drawings & Diagrams ────────────────────────────────────── */}
      <section className="border border-zinc-800/80 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-13.5A2.25 2.25 0 003.5 18h16.5a2.25 2.25 0 002.25-2.25m-18 0V4.5A2.25 2.25 0 016 2.25h12A2.25 2.25 0 0120.25 4.5v11.25m-18 0A2.25 2.25 0 006 18h12A2.25 2.25 0 0020.25 15.75M7.5 12h.008v.008H7.5V12zm3 0h.008v.008H10.5V12zm3 0h.008v.008H13.5V12zm3 0h.008v.008H16.5V12z" />
          </svg>
          Product Drawings & Diagrams (Upload to Vercel Blob / Local)
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              type: "DIMENSION_PUMP",
              label: "Pump Dimension Drawing",
              url: dimensionPumpUrl,
              setUrl: setDimensionPumpUrl,
            },
            {
              type: "DIMENSION_CONTROLLER",
              label: "Controller Dimension Drawing",
              url: dimensionControllerUrl,
              setUrl: setDimensionControllerUrl,
            },
            {
              type: "LAYOUT_DIAGRAM",
              label: "Installation Layout Diagram",
              url: layoutDiagramUrl,
              setUrl: setLayoutDiagramUrl,
            },
          ].map(({ type, label, url, setUrl }) => (
            <div key={type} className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {label}
              </label>

              {url ? (
                <div className="relative group rounded-xl border border-zinc-700 overflow-hidden bg-zinc-950 aspect-video flex items-center justify-center p-2">
                  <img
                    src={url}
                    alt={label}
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-700 rounded-xl p-4 text-center aspect-video flex flex-col items-center justify-center bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, type)}
                    disabled={uploading[type]}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading[type] ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-zinc-500">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-6 h-6 text-zinc-500 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-zinc-400 font-semibold">Upload Image</span>
                      <span className="text-[10px] text-zinc-600">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── BOM / Price Items ─────────────────────────────────────── */}
      <section className="border border-zinc-800/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            BOM / Price Items
          </h2>
          <button
            type="button"
            onClick={addPriceItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c8a44e]/10 text-[#c8a44e] text-sm font-medium rounded-lg border border-[#c8a44e]/20 hover:bg-[#c8a44e]/15 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>
        </div>

        {priceItems.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">
            No BOM items yet. Click &ldquo;Add Item&rdquo; to add line items.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty in 1 Set</div>
              <div className="col-span-1">Unit</div>
              <div className="col-span-3">Price/Unit (USD)</div>
              <div className="col-span-1"></div>
            </div>

            {priceItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-start bg-zinc-800/30 rounded-xl p-2"
              >
                <div className="col-span-5">
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      updatePriceItem(index, "description", e.target.value)
                    }
                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                    rows={2}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.qtyIn1Set}
                    onChange={(e) =>
                      updatePriceItem(index, "qtyIn1Set", Number(e.target.value))
                    }
                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                    min={1}
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) =>
                      updatePriceItem(index, "unit", e.target.value)
                    }
                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    value={item.pricePerUnitUsd}
                    onChange={(e) =>
                      updatePriceItem(
                        index,
                        "pricePerUnitUsd",
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                    min={0}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removePriceItem(index)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Submit ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#c8a44e] hover:bg-[#d4b65c] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-[13px] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

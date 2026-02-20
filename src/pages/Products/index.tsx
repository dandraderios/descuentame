import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ProductsTable from "../../components/tables/BasicTables/ProductsTable"; // ← Corregido
import { generateProduct, detectStore } from "../../api/products";

export default function ProductsPage() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    url: "",
    store: "falabella",
    country: "cl",
    generate_feed: true,
    generate_story: true,
  });
  const [detectedStore, setDetectedStore] = useState<string | null>(null);

  // Detectar tienda automáticamente
  const handleUrlChange = async (url: string) => {
    setGenerateForm({ ...generateForm, url });
    if (url.includes("http")) {
      try {
        const result = await detectStore(url);
        setDetectedStore(result.detected_store);
        setGenerateForm({ ...generateForm, url, store: result.detected_store });
      } catch (error) {
        console.error("Error detectando tienda:", error);
      }
    }
  };

  // Generar producto
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const result = await generateProduct(generateForm);
      alert(`✅ Producto generado: ${result.product_name}`);
      setShowGenerator(false);
      // Recargar la tabla
      window.location.reload();
    } catch (error) {
      alert(
        `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Productos | Multi-Store Image Generator"
        description="Gestión de productos generados"
      />

      <PageBreadcrumb pageTitle="Productos" />

      <div className="space-y-6">
        {/* Botón de generar nuevo producto */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Generar Nuevo Producto
          </button>
        </div>

        {/* Formulario de generación */}
        {showGenerator && (
          <ComponentCard title="Generar Nuevo Producto">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Producto
                </label>
                <input
                  type="url"
                  value={generateForm.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://www.falabella.com/..."
                  required
                />
                {detectedStore && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Tienda detectada: {detectedStore}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tienda
                  </label>
                  <select
                    value={generateForm.store}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        store: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="falabella">Falabella</option>
                    <option value="ripley">Ripley</option>
                    <option value="paris">Paris</option>
                    <option value="mercadolibre">MercadoLibre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <select
                    value={generateForm.country}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        country: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cl">Chile</option>
                    <option value="pe">Perú</option>
                    <option value="ar">Argentina</option>
                    <option value="co">Colombia</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={generateForm.generate_feed}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        generate_feed: e.target.checked,
                      })
                    }
                  />
                  <span>Generar Feed</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={generateForm.generate_story}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        generate_story: e.target.checked,
                      })
                    }
                  />
                  <span>Generar Story</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {generating ? "Generando..." : "Generar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerator(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </ComponentCard>
        )}

        {/* Tabla de productos */}
        <ComponentCard title="Productos Generados">
          <ProductsTable />
        </ComponentCard>
      </div>
    </>
  );
}

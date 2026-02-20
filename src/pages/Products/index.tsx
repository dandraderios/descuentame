import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ProductsTable from "../../components/tables/BasicTables/ProductsTable";
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
    link_afiliados: "", // ← Nuevo campo
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
      const result = await generateProduct({
        url: generateForm.url,
        store: generateForm.store,
        country: generateForm.country,
        generate_feed: generateForm.generate_feed,
        generate_story: generateForm.generate_story,
        link_afiliados: generateForm.link_afiliados || undefined, // ← Enviar link
      });

      alert(`✅ Producto generado: ${result.product_name}`);
      setShowGenerator(false);

      // Limpiar formulario
      setGenerateForm({
        url: "",
        store: "falabella",
        country: "cl",
        generate_feed: true,
        generate_story: true,
        link_afiliados: "",
      });
      setDetectedStore(null);

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
              {/* URL del Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={generateForm.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.falabella.com/..."
                  required
                />
                {detectedStore && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Tienda detectada: {detectedStore}
                  </p>
                )}
              </div>

              {/* Tienda y País */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tienda <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={generateForm.store}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        store: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="falabella">Falabella</option>
                    <option value="ripley">Ripley</option>
                    <option value="paris">Paris</option>
                    <option value="mercadolibre">MercadoLibre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={generateForm.country}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        country: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="cl">Chile</option>
                    <option value="pe">Perú</option>
                    <option value="ar">Argentina</option>
                    <option value="co">Colombia</option>
                    <option value="mx">México</option>
                  </select>
                </div>
              </div>

              {/* Link de Afiliado (nuevo campo) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link de Afiliado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101"
                      />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={generateForm.link_afiliados}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        link_afiliados: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.tienda.com/producto?afiliado=123"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Opcional: Link con tu código de afiliado para ganar comisiones
                </p>
              </div>

              {/* Opciones de generación */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateForm.generate_feed}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        generate_feed: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Generar Feed (1080x1350)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateForm.generate_story}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        generate_story: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Generar Story (1080x1920)
                  </span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    "Generar Producto"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerator(false);
                    setGenerateForm({
                      url: "",
                      store: "falabella",
                      country: "cl",
                      generate_feed: true,
                      generate_story: true,
                      link_afiliados: "",
                    });
                    setDetectedStore(null);
                  }}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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

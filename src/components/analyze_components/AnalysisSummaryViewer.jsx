import React from 'react';
import { MdCode, MdClass, MdFunctions, MdCallSplit, MdDescription, MdInfo, MdOutlineError, MdCheckCircle } from 'react-icons/md'; // Tambah ikon
import { FaTag } from 'react-icons/fa'; // Untuk badge tipe

/**
 * Komponen untuk menampilkan detail visual dari semua komponen kode yang ditemukan dalam repositori.
 * @param {object} props
 * @param {object} props.componentsData - Objek di mana key adalah ID komponen dan value adalah objek CodeComponent.
 */
function AnalysisSummaryViewer({ componentsData }) {
  if (!componentsData || Object.keys(componentsData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg h-96 text-base-content/70">
        <MdInfo className="h-10 w-10 mb-4" />
        <p className="text-lg">No code components data available.</p>
      </div>
    );
  }

  // Header yang akan muncul di paling atas
  const repoName = componentsData[Object.keys(componentsData)[0]]?.relative_path.split('\\')[0] || "Repository";

  return (
    <div className="flex flex-col gap-8 p-4"> {/* Container utama untuk semua komponen */}
      <h1 className="text-4xl font-extrabold text-base-content mb-4 border-b-2 border-base-content/20 pb-2 flex items-center">
        <MdCode className="h-10 w-10 mr-3 text-primary" />
        Code Component Visualization for "{repoName}"
      </h1>
      <div className='max-h-240 overflow-y-auto'>
        {Object.values(componentsData).map((component) => (
          <div key={component.id} className="card bg-base-100 shadow-xl border border-base-content/10">
            <div className="card-body p-0"> {/* Tidak ada padding di card-body, kita atur padding internal */}
              {/* Header Komponen */}
              <div className="bg-primary text-primary-content p-4 rounded-t-lg flex items-center justify-between">
                <h2 className="text-xl font-bold m-0 flex items-center">
                  {component.component_type === 'class' && <MdClass className="h-6 w-6 mr-2" />}
                  {component.component_type === 'function' && <MdFunctions className="h-6 w-6 mr-2" />}
                  {component.component_type === 'method' && <MdFunctions className="h-6 w-6 mr-2" />}
                  {component.id.split('.').pop()} {/* Hanya nama komponen, bukan full ID */}
                  <span className="badge badge-outline ml-3 opacity-80 border-primary-content/50 text-primary-content">
                    {component.component_type.toUpperCase()}
                  </span>
                </h2>
                {/* Tambah ikon/info lain di header jika perlu */}
              </div>

              {/* Detail Komponen */}
              <div className="p-6"> {/* Padding untuk isi detail */}
                <div className="mb-3">
                  <span className="font-bold text-base-content/70 w-36 inline-block">ID Penuh:</span>
                  <span className="text-base-content break-all">{component.id}</span>
                </div>
                <div className="mb-3">
                  <span className="font-bold text-base-content/70 w-36 inline-block">File:</span>
                  <span className="text-base-content break-all">{component.relative_path}</span>
                </div>
                <div className="mb-3">
                  <span className="font-bold text-base-content/70 w-36 inline-block">Baris:</span>
                  <span className="text-base-content">{component.start_line} - {component.end_line}</span>
                </div>
                <div className="mb-3 flex items-start"> {/* Gunakan flex items-start untuk align docstring */}
                  <span className="font-bold text-base-content/70 w-36 inline-block flex-shrink-0">Docstring Ada:</span>
                  <span className="text-base-content flex items-center">
                    {component.has_docstring ? (
                      <MdCheckCircle className="h-5 w-5 text-success mr-1" />
                    ) : (
                      <MdOutlineError className="h-5 w-5 text-error mr-1" />
                    )}
                    {component.has_docstring ? "Ya" : "Tidak"}
                  </span>
                </div>

                {/* Dependencies */}
                <div className="mb-4">
                  <span className="font-bold text-base-content/70 inline-block w-36 align-top">Dependencies:</span>
                  {component.depends_on && component.depends_on.length > 0 ? (
                    <div className="inline-block align-top">
                      <ul className="flex flex-wrap gap-2 list-none p-0 m-0"> {/* Flex wrap untuk badges */}
                        {component.depends_on.map((dep, index) => (
                          <li key={index} className="badge badge-info badge-outline text-xs">
                            {dep.split('.').pop()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-base-content/60">Tidak ada</span>
                  )}
                </div>

                {/* Docstring Mentah */}
                {component.docstring && (
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-base-content mb-3 flex items-center">
                      <FaTag className="h-5 w-5 mr-2 text-warning" />
                      Docstring Mentah:
                    </h3>
                    <pre className="doc-content mockup-code bg-white text-base-content p-4 rounded-lg overflow-auto max-h-48 text-sm"> {/* mockup-code DaisyUI */}
                      <code>{component.docstring}</code>
                    </pre>
                  </div>
                )}

                {/* Dokumentasi Otomatis (generated_doc) */}
                {component.generated_doc && (
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-base-content mb-3 flex items-center">
                      <MdDescription className="h-6 w-6 mr-2 text-info" />
                      Dokumentasi Otomatis:
                    </h3>
                    <pre className="doc-content mockup-code bg-white text-base-content p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      <code>{component.generated_doc}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisSummaryViewer;
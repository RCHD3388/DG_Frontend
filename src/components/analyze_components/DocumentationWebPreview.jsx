// src/components/analyze_components/DocumentationWebPreview.js

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { configService } from '../../services/ConfigService';
import ProjectOverview from './ProjectOverview';
import { Activity, CheckCircle2, Code2, Eye, Settings, XCircle } from 'lucide-react';

const VITE_BACKEND_GRAPH_VISUAL_BASE_URL = configService.getValue('VITE_BACKEND_GRAPH_VISUAL_BASE_URL');

// --- Helper Components (Tidak ada perubahan di sini) ---
const CodeBlock = ({ code }) => (
  <div className="mockup-code my-4">
    {code.trim().split('\n').map((line, index) => (
      <pre data-prefix={index + 1} key={index}><code>{line}</code></pre>
    ))}
  </div>
);

const Section = ({ title, children }) => {
  if (!children || (Array.isArray(children) && children.filter(Boolean).length === 0)) return null;
  return (
    <div className="mt-6">
      <h4 className="text-xl font-bold border-b border-base-300 pb-2 mb-3">{title}</h4>
      {children}
    </div>
  );
};

const DescriptionTable = ({ items, columns = ['Name', 'Type', 'Description'], format = "default" }) => {
  if (!items || items.length === 0) return null;

  const checkIfWithDefaultValue = () => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].default !== undefined && items[i].default !== null) return true;
    }
    return false;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full table-auto table-zebra">
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{col}</th>)}
            {format == "parameter" && checkIfWithDefaultValue() && <th>Default Value</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              {format === "parameter" && <>
                <td className="font-mono">{item.name}</td>
                <td className="font-mono">{item.type}</td>
                {/* {checkIfWithDefaultValue() && <td className="font-mono">{item.default || 'N/A'}</td>} */}
              </>}
              {format === "default" && <td className="font-mono">{item.type || item.error || item.warning || item.name || 'N/A'}</td>}
              <td>{item.description}</td>
              {format === "parameter" && <>
                {checkIfWithDefaultValue() &&
                  <td className="font-mono">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(item.default) || 'N/A'}
                    </pre>
                  </td>
                }
              </>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ComponentDocumentation = ({ component, source_code_mode = 'signature'}) => {
  const docJson = component?.docgen_final_state?.final_state?.documentation_json;
  // useEffect(()=> {
  //   console.log(docJson);
  // }, [])
  if (!component) return null;
  return (
    <article className="prose max-w-none p-6 bg-base-100 rounded-box shadow">
      <div className="border-b border-base-300 pb-4">
        <h2 className="mt-0 mb-2 text-2xl font-bold">COMPONENT ID : {component.id}</h2>
        <p className="text-md text-base-content/60 font-mono">File Location  : {component.relative_path}</p>
        <p className="text-md text-base-content/60 font-mono">Component Type : {component.component_type}</p>
      
        {(source_code_mode == "signature" || source_code_mode == "both") && <Section title="Code Signature">
          <div className="bg-[#1e1e1e] p-4 overflow-x-auto custom-scrollbar border-t border-base-content/5">
            <pre className="text-sm leading-relaxed font-mono text-gray-300 m-0">
              <code>{component.component_signature}</code>
            </pre>
          </div>
        </Section>}
      </div>

      {/* --- BAGIAN BARU: SOURCE CODE ACCORDION --- */}
      {component.source_code && (source_code_mode == "full" || source_code_mode == "both") &&(
        <div className="not-prose mt-4">
          <div className="collapse collapse-arrow bg-base-200 border border-base-content/10 rounded-l shadow-sm group">
            <input type="checkbox" className="peer" />
            <div className="collapse-title flex items-center gap-3 py-4 px-6 group-hover:bg-base-300/50 transition-colors">
              <Code2 size={20} className="text-primary" />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm uppercase">Original Source Code</span>
                <span className="text-[10px] opacity-50 font-bold italic">Click to expand and view the full implementation</span>
              </div>
            </div>
            <div className="collapse-content px-0">
              <div className="bg-[#1e1e1e] p-6 overflow-x-auto custom-scrollbar border-t border-base-content/5">
                <pre className="text-sm leading-relaxed font-mono text-gray-300 m-0">
                  <code>{component.source_code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {component.dependency_graph_url && component.dependency_graph_url !== '' ? (
        <Section title="Dependency Graph">
          <img
            src={`${VITE_BACKEND_GRAPH_VISUAL_BASE_URL}/${component.dependency_graph_url}`}
            alt={`Dependency graph for ${component.id}`}
            className="rounded-lg shadow-md border border-base-300"
          />
        </Section>
      ) : (
        <></>
      )}

      {docJson && (
        <>
          <Section title="Summary">{docJson.short_summary}</Section>
          <Section title="Description">{docJson.extended_summary}</Section>
          {/* <p className="lead mt-6 mb-4 font-semibold">{docJson.short_summary}</p> */}
          {/* <p>{docJson.extended_summary}</p> */}
          {docJson.parameters && docJson.parameters.length > 0 && <Section title="Parameters"><DescriptionTable items={docJson.parameters} columns={['Name', 'Type', 'Description']} format='parameter' /></Section>}
          {docJson.attributes && <Section title="Attributes"><DescriptionTable items={docJson.attributes} columns={['Name', 'Type', 'Description']} format='parameter' /></Section>}
          {docJson.returns && <Section title="Returns"><DescriptionTable items={docJson.returns} columns={['Type', 'Description']} /></Section>}
          {docJson.yields && <Section title="Yields"><DescriptionTable items={docJson.yields} columns={['Type', 'Description']} /></Section>}
          {docJson.receives && <Section title="Receives"><DescriptionTable items={docJson.receives} columns={['Name', 'Type', 'Description']} format='parameter' /></Section>}
          {docJson.raises && <Section title="Raises"><DescriptionTable items={docJson.raises} columns={['Exception', 'Description']} /></Section>}
          {docJson.warns && <Section title="Warns"><DescriptionTable items={docJson.warns} columns={['Warn', 'Description']} /></Section>}
          {docJson.warnings_section && <Section title="Warnings"><p>{docJson.warnings_section}</p></Section>}
          {docJson.see_also && <Section title="See Also"><DescriptionTable items={docJson.see_also} columns={['Name', 'Description']} /></Section>}
          {docJson.notes && <Section title="Notes"><p>{docJson.notes}</p></Section>}
          {docJson.examples && <Section title="Examples"><CodeBlock code={docJson.examples || ''} /></Section>}
        </>
      )}
    </article>
  );
};


// ===================================================================
// === PERBAIKAN 2: Komponen Rekursif untuk Sidebar Bertingkat ===
// ===================================================================
const SidebarMenuItem = ({ component, selectedComponentId, onSelect }) => {
  const getComponentName = (component) => {
    if (component.component_type === 'class') return component.id.split('.').pop();
    if (component.component_type === 'function') return component.id.split('.').pop();
    // return component.id.split('.').slice(-2).join('.');
    return component.id.split('.').pop();
  };

  const isActive = selectedComponentId === component.id;

  return (
    <li>
      <a
        href={`#${component.id}`}
        className={`${isActive ? 'active font-bold underline' : ''}`}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'wrap' }}
        onClick={(e) => { e.preventDefault(); onSelect(component.id); }}
      >
        {getComponentName(component)}
      </a>
      {/* Jika ada method_components, render sub-menu secara rekursif */}
      {component.method_components && component.method_components.length > 0 && (
        <ul>
          {component.method_components.map(method => (
            <>
              <SidebarMenuItem
                key={method.id}
                component={method}
                selectedComponentId={selectedComponentId}
                onSelect={onSelect}
              />
            </>
          ))}
        </ul>
      )}
    </li>
  );
};
// ===================================================================


function DocumentationWebPreview({ documentationData }) {
  const { showToast } = useOutletContext();
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const [activeView, setActiveView] = useState('component'); // 'overview' or 'component'

  const [config, setConfig] = useState({
    includeOverview: true,
    sourceCodeMode: 'signature', // 'signature', 'full', 'both', 'none'
    includeStyleOverview: false
  });
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const components = documentationData?.components || [];

  useEffect(() => {
    console.log(documentationData)
  }, [documentationData])

  useEffect(() => {
    if (components.length > 0) {

      const isSelectionValid = findComponentById(selectedComponentId, components);
      if (!isSelectionValid) {
        setSelectedComponentId(components[0].id);
      }
    }
  }, [components, selectedComponentId]); // Ketergantungan tetap sama

  const findComponentById = (id, componentList) => {
    for (const component of componentList) {
      if (component.id === id) return component;
      if (component.method_components) {
        const found = findComponentById(id, component.method_components);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedComponent = findComponentById(selectedComponentId, components);

  // GANTI KESELURUHAN FUNGSI handleExportToHTML DENGAN INI

  const handleExportToHTML = async () => {
    if (!documentationData?.components || documentationData.components.length === 0) {
      showToast('No content available to export.', 'error');
      return;
    }
    setIsExporting(true);

    try {
      // === BAGIAN BARU: Fungsi helper rekursif untuk nama komponen ===
      const getComponentNameForExport = (component) => {
        if (component.component_type === 'class' || component.component_type === 'function') {
          return component.id.split('.').pop();
        }
        return component.id.split('.').pop();
      };

      const generateRecursiveMenuHtml = (componentList) => {
        if (!componentList || componentList.length === 0) return '';
        let html = '<ul>';
        for (const comp of componentList) {
          html += `
            <li>
              <a href="#${comp.id}" data-target-id="${comp.id}">
                ${getComponentNameForExport(comp)}
              </a>
              ${generateRecursiveMenuHtml(comp.method_components)}
            </li>
          `;
        }
        html += '</ul>';
        return html;
      };

      // === PERBAIKAN: Tambahkan item "Project Overview" ke sidebar HTML ===
      const sidebarHtml = `
        <aside class="sidebar">
          <div class="menu bg-base-200 rounded-box w-full sidebar-menu">
            <ul class="menu bg-base-200 rounded-box w-full flex-shrink-0">
                <li class="mb-1">
                    <a href="#__overview__" data-target-id="__overview__" class="bg-base-300 text-base-content">
                        Project Overview
                    </a>
                </li>
            </ul>
            <div class="divider my-1"></div>
            <h3 class="text-lg font-bold p-4">Code Components</h3>
            ${generateRecursiveMenuHtml(components)}
          </div>
        </aside>
      `;

      const flattenComponents = (componentList) => {
        let allComponents = [];
        for (const comp of componentList) {
          allComponents.push(comp);
          if (comp.method_components) {
            allComponents = allComponents.concat(flattenComponents(comp.method_components));
          }
        }
        return allComponents;
      };

      const allComponentsFlat = flattenComponents(components);

      // === PERBAIKAN: Render ProjectOverview dan semua ComponentDocumentation ===
      const overviewHtml = `
        <div class="doc-content" data-component-id="__overview__" style="display: none;">
            ${ReactDOMServer.renderToStaticMarkup(<ProjectOverview documentationData={documentationData} />)}
        </div>
      `;

      let componentsHtml = allComponentsFlat.map(comp => `
        <div class="doc-content" data-component-id="${comp.id}" style="display: none;">
          ${ReactDOMServer.renderToStaticMarkup(<ComponentDocumentation component={comp} source_code_mode={config.sourceCodeMode} />)}
        </div>
      `).join('');

      const finalContentHtml = overviewHtml + componentsHtml;

      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = finalContentHtml;

      const images = tempContainer.querySelectorAll('img');
      if (images.length > 0) {
        showToast(`Embedding ${images.length} images... This may take a moment.`, 'info');
      }

      const imagePromises = Array.from(images).map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith('data:')) return;
        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch (error) {
          console.error(`Could not embed image ${src}:`, error);
          img.alt += " (Failed to load)";
        }
      });

      await Promise.all(imagePromises);

      const finalEmbeddedContentHtml = tempContainer.innerHTML;

      // === PERBAIKAN: Perbarui script untuk menangani ID "__overview__" ===
      const script = `<script>
        document.addEventListener('DOMContentLoaded', function() {
          const links = document.querySelectorAll('.sidebar-menu a');
          const contents = document.querySelectorAll('.doc-content');
          function showContent(id) {
            contents.forEach(c => { c.style.display = 'none'; });
            links.forEach(l => { l.classList.remove('active', 'font-bold'); l.classList.add('bg-base-300', 'text-base-content'); });
            const contentToShow = document.querySelector(\`.doc-content[data-component-id="\${id}"]\`);
            if (contentToShow) contentToShow.style.display = 'block';
            const activeLink = document.querySelector(\`.sidebar-menu a[data-target-id="\${id}"]\`);
            if (activeLink) {
              activeLink.classList.remove('bg-base-300', 'text-base-content');
              activeLink.classList.add('active', 'font-bold');
            }
          }
          links.forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              const targetId = this.getAttribute('data-target-id');
              showContent(targetId);
              history.pushState(null, null, '#' + targetId);
            });
          });
          const initialId = window.location.hash.substring(1) || '__overview__';
          showContent(initialId);
        });
      </script>`;

      // (Template HTML lainnya tetap sama)
      const fullHtml = `<!DOCTYPE html><html lang="en" data-theme="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Documentation Export</title><link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css" rel="stylesheet" type="text/css" /><script src="https://cdn.tailwindcss.com"></script><style>body { padding: 1.5rem; background-color: hsl(var(--b2)); } .main-container {display: flex;gap: 1.5rem;margin: auto; max-width: 1600px;} .sidebar {flex-shrink: 0;width: 25%;height: 100vh; position: sticky; top: 1.5rem; overflow-y: auto;} .main-content {flex-grow: 1;min-width: 0;} .sidebar-menu ul {padding-left: 1rem;} .sidebar-menu a { white-space: normal; line-height: 1.4; } .sidebar-menu a.active {background-color: hsl(var(--p));color: hsl(var(--pc));}</style></head><body><div class="mx-auto"><h1 class="text-4xl font-bold mb-6 text-center">Generated Documentation</h1><div class="main-container">${sidebarHtml}<main class="main-content">${finalEmbeddedContentHtml}</main></div></div>${script}</body></html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'documentation.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Documentation exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export HTML:', error);
      showToast('An error occurred during export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (components.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-base-200 rounded-lg p-8">
        <p className="text-base-content/70">Documentation preview will appear here.</p>
      </div>
    );
  }

  const countComponents = () => {
    let count = components.length;
    count += components.reduce((acc, curr) => {
      return acc + (curr.method_components?.length || 0);
    }, 0);
    return count > 999 ? "999+" : count;
  }

  return (
    // 1. Kontainer utama diubah menjadi flex-col dengan tinggi penuh
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end mb-4 flex-shrink-0">
        <button className="btn btn-primary mr-2" onClick={handleExportToHTML} disabled={isExporting}>
          {isExporting && <span className="loading loading-spinner"></span>}
          Export to HTML
        </button>
        <button
          className="btn btn-warning font-bold text-warning-content rounded-sm shadow-lg shadow-warning/20 hover:scale-105 transition-transform"
          onClick={() => document.getElementById('config_modal').showModal()}
          disabled={isExporting}
        >
          <Settings size={18} />
          Configuration
        </button>
      </div>

      {/* 2. Kontainer untuk sidebar dan konten, mengisi sisa ruang */}
      <div className="flex gap-6 flex-grow min-h-0">

        {/* 3. Sidebar diubah menjadi flex-col */}
        <aside className="lg:w-1/4 bg-base-200 rounded-box p-2 h-full flex flex-col">
          {/* Item Menu Baru untuk Overview */}
          <ul className="menu bg-base-100 border border-base-content/5 rounded-box w-full p-2 shadow-sm">
            <li>
              <a
                onClick={() => setActiveView('overview')}
                className={`
        /* Transisi halus saat perpindahan state */
        transition-all duration-200 
        
        /* State Default (Tidak Active): Background solid, teks jelas, tidak transparan */
        bg-base-200 text-base-content hover:bg-base-300
        
        /* State Active: Menggunakan warna primary (atau warna pilihan Anda) */
        ${activeView === 'overview'
                    ? 'active !bg-primary !text-primary-content font-bold shadow-md'
                    : ''
                  }
      `}
              >
                <Activity size={18} />
                Project Overview
              </a>
            </li>
          </ul>

          <div className="divider my-1"></div>

          <div className="text-lg font-bold px-4 flex-shrink-0">Code Components</div>

          {/* 4. Wrapper baru untuk membuat HANYA daftar menu yang bisa di-scroll */}
          <div className="overflow-y-auto flex-grow max-h-screen">
            <ul className="menu bg-base-200 rounded-box w-full">
              {components.map(comp => (
                <SidebarMenuItem
                  key={comp.id}
                  component={comp}
                  selectedComponentId={selectedComponentId}
                  onSelect={(id) => {
                    setSelectedComponentId(id);
                    setActiveView('component');
                  }}
                />
              ))}
            </ul>
          </div>
        </aside>

        {/* 5. Konten utama sekarang memiliki overflow-y-auto sendiri */}
        <main className="lg:w-3/4 pr-2 ">
          {activeView === 'overview' && (
            <ProjectOverview documentationData={documentationData} />
          )}

          {activeView === 'component' && (selectedComponent ? <ComponentDocumentation component={selectedComponent} source_code_mode={config.sourceCodeMode} /> :
            <div className="flex items-center justify-center h-full bg-base-200 rounded-lg p-8">
              <p>Select a component to view its documentation.</p>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL CONFIGURATION FINAL REVISION --- */}
      <dialog id="config_modal" className="modal modal-middle backdrop-blur-md transition-all">
        {/* Lebar menggunakan w-11/12 untuk keamanan margin layar, max-w-5xl untuk kelegaan konten */}
        <div className="modal-box w-11/12 max-w-5xl bg-base-100 border border-base-content/10 shadow-2xl p-0 overflow-hidden flex flex-col">

          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-base-content/5 bg-base-200/30 flex-shrink-0">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-warning text-warning-content rounded-2xl shadow-xl animate-pulse-slow">
                <Settings size={32} />
              </div>
              <div>
                <h3 className="font-black text-2xl sm:text-3xl tracking-tight">Documentation Settings</h3>
                <p className="text-sm opacity-60 font-semibold italic">Customizing your documentation output.</p>
              </div>
            </div>
          </div>

          {/* Body Section dengan Smart Wrapping */}
          <div className="flex flex-wrap md:flex-nowrap w-full overflow-y-auto max-h-[70vh]">

            {/* Sisi Kiri: Configuration Controls (Lebih mendominasi) */}
            <div className="w-full md:w-3/5 p-6 sm:p-10 space-y-4 border-b md:border-b-0 md:border-r border-base-content/10">
              <div>
                <label className="text-sm font-black uppercase tracking-[0.25em] text-primary mb-2 block opacity-70">
                  Arsitektur Utama
                </label>
                <div className="grid grid-cols-1 gap-4">
                  {/* Toggle Overview */}
                  <div className="form-control">
                    <label className="label cursor-pointer flex items-center justify-between bg-base-200/40 hover:bg-base-200 p-5 rounded-1xl transition-all border border-base-content/5 group shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="label-text font-extrabold text-base group-hover:text-primary transition-colors">Project Overview</span>
                        <span className="text-[10px] opacity-40 uppercase font-bold tracking-wider">Include summary and metrics</span>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-lg"
                        checked={config.includeOverview}
                        onChange={(e) => updateConfig('includeOverview', e.target.checked)}
                      />
                    </label>
                  </div>

                </div>
              </div>

              {/* Source Code Mode */}
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-[0.25em] text-primary block opacity-70">Visualisasi Source Code</label>
                <div className="relative group">
                  <select
                    className="select select-bordered w-full bg-base-100 focus:outline-none focus:ring-4 focus:ring-primary/10 border-base-content/20 rounded-1xl font-bold h-16 text-lg transition-all"
                    value={config.sourceCodeMode}
                    onChange={(e) => updateConfig('sourceCodeMode', e.target.value)}
                  >
                    <option value="signature">Code Signature Only</option>
                    <option value="full">Complete Source Code</option>
                    <option value="both">Complete Code & Signature</option>
                  </select>
                </div>
                <p className="text-xs opacity-50 px-3 italic font-medium">Metode ini menentukan bagaimana blok kode dirender pada setiap detail komponen.</p>
              </div>
            </div>

            {/* Sisi Kanan: Live Status (Tidak akan terpotong karena MD:W-2/5) */}
            <div className="w-full md:w-2/5 p-6 sm:p-10 bg-base-200/40 flex flex-col">
              <label className="text-sm font-black uppercase tracking-[0.25em] opacity-40 mb-2 block">Live Preview State</label>

              <div className="flex-grow space-y-2">
                <div className="bg-base-100 px-6 py-4 rounded-[0.5rem] border border-base-content/5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Overview:</span>
                    <span className={`badge badge-md font-black px-4 py-3 ${config.includeOverview ? "badge-success text-success-content" : "badge-error text-error-content"}`}>
                      {config.includeOverview ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Visibility:</span>
                    <span className="badge badge-primary badge-outline font-mono font-black border-2">{config.sourceCodeMode}</span>
                  </div>
                </div>

                {/* Stats Card yang Solid */}
                <div className="p-8 bg-gradient-to-br from-primary to-indigo-700 text-primary-content rounded-[0.5rem] shadow-2xl relative overflow-hidden group">
                  <Activity size={120} className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-125 transition-transform duration-700" />
                  <div className="relative z-10">
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-70 mb-3">Total Component Terdeteksi</p>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-black leading-none tracking-tighter">{countComponents()}</span>
                      <span className="text-sm font-bold opacity-80 mb-1 uppercase tracking-widest italic">Components</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action - Terkunci di Bawah */}
          <div className="p-6 bg-base-100 border-t border-base-content/10 flex-shrink-0">
            <form method="dialog" className="flex flex-col sm:flex-row justify-end gap-4">
              <button className="btn btn-warning rounded-1xl px-8 font-bold order-2 sm:order-1">Batalkan</button>
              <button className="btn btn-primary rounded-1xl px-14 shadow-2xl shadow-primary/40 font-black uppercase tracking-widest hover:scale-105 transition-all order-1 sm:order-2">
                Apply & Reload Documentation
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default DocumentationWebPreview;
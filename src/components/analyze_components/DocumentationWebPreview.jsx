// src/components/analyze_components/DocumentationWebPreview.js

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { configService } from '../../services/ConfigService';

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

const DescriptionTable = ({ items, columns = ['Name', 'Type', 'Description'] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="table w-full table-zebra">
        <thead>
          <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="font-mono">{item.name || item.error || 'N/A'}</td>
              {columns.includes('Type') && <td className="font-mono text-info">{item.type}</td>}
              <td>{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ComponentDocumentation = ({ component }) => {
  const docJson = component?.docgen_final_state?.final_state?.documentation_json;
  if (!component) return null;
  return (
    <article className="prose max-w-none p-6 bg-base-100 rounded-box shadow">
      <div className="border-b border-base-300 pb-4">
        <p className="text-sm text-base-content/60 font-mono">{component.relative_path}</p>
        <h2 className="mt-0">{component.id}</h2>
        <div className="mockup-code text-sm">
          <pre><code>{component.component_signature}</code></pre>
        </div>
      </div>

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
          <p className="lead mt-6">{docJson.short_summary}</p><p>{docJson.extended_summary}</p>
          <Section title="Parameters"><DescriptionTable items={docJson.parameters} /></Section>
          <Section title="Returns"><DescriptionTable items={docJson.returns} columns={['Name', 'Type', 'Description']} /></Section>
          <Section title="Raises"><DescriptionTable items={docJson.raises} columns={['Exception', 'Description']} /></Section>
          <Section title="See Also"><DescriptionTable items={docJson.see_also} columns={['Reference', 'Description']} /></Section>
          <Section title="Notes"><p>{docJson.notes}</p></Section>
          <Section title="Examples"><CodeBlock code={docJson.examples || ''} /></Section>
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

  const components = documentationData?.components || [];

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

  const handleExportToHTML = async () => {
    if (components.length === 0) {
      showToast('No content available to export.', 'error');
      return;
    }
    setIsExporting(true);

    try {
      // (Fungsi helper rekursif untuk menu dan flatten tetap sama)
      const generateRecursiveMenuHtml = (componentList) => {
        if (!componentList || componentList.length === 0) return '';
        let html = '<ul>';
        for (const comp of componentList) {
          html += `<li><a href="#${comp.id}" data-target-id="${comp.id}">${comp.id.split('.').pop()}</a>${generateRecursiveMenuHtml(comp.method_components)}</li>`;
        }
        html += '</ul>';
        return html;
      };

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

      // 1. Render semua konten ke dalam string HTML terlebih dahulu
      const allComponentsFlat = flattenComponents(components);
      let contentHtml = allComponentsFlat.map(comp => `
        <div class="doc-content" data-component-id="${comp.id}" style="display: none;">
          ${ReactDOMServer.renderToStaticMarkup(<ComponentDocumentation component={comp} />)}
        </div>
      `).join('');

      // 2. Buat elemen DOM sementara di memori untuk memanipulasi gambar
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = contentHtml;

      const images = tempContainer.querySelectorAll('img');
      if (images.length > 0) {
        showToast(`Embedding ${images.length} images... This may take a moment.`, 'info');
      }

      // 3. Buat array promise untuk mengambil dan mengonversi setiap gambar
      const imagePromises = Array.from(images).map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith('data:')) return; // Lewati jika sudah base64 atau kosong

        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl; // Ganti src dengan data Base64
        } catch (error) {
          console.error(`Could not embed image ${src}:`, error);
          img.alt += " (Failed to load)"; // Tandai gambar yang gagal dimuat
        }
      });

      // 4. Tunggu semua proses konversi gambar selesai
      await Promise.all(imagePromises);

      // 5. Ambil HTML final dari kontainer yang telah dimodifikasi
      const finalContentHtml = tempContainer.innerHTML;
      const sidebarHtml = `<aside class="sidebar overflow-y-auto max-h-screen"><h3 class="text-lg font-bold p-4">Components</h3><div class="menu bg-base-200 rounded-box w-full sidebar-menu">${generateRecursiveMenuHtml(components)}</div></aside>`;

      const script = `<script>
        document.addEventListener('DOMContentLoaded', function() {
          const links = document.querySelectorAll('.sidebar-menu a');
          const contents = document.querySelectorAll('.doc-content');
          const menuLists = document.querySelectorAll('.sidebar-menu ul');
          menuLists.forEach(ul => { if (ul.innerHTML.trim() === '') { ul.remove(); } });
          function showContent(id) {
            contents.forEach(c => { c.style.display = 'none'; });
            links.forEach(l => { l.classList.remove('active'); });
            const contentToShow = document.querySelector(\`.doc-content[data-component-id="\${id}"]\`);
            if (contentToShow) contentToShow.style.display = 'block';
            const activeLink = document.querySelector(\`.sidebar-menu a[data-target-id="\${id}"]\`);
            if (activeLink) activeLink.classList.add('active');
          }
          links.forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              const targetId = this.getAttribute('data-target-id');
              showContent(targetId);
              history.pushState(null, null, '#' + targetId);
            });
          });
          const initialHash = window.location.hash.substring(1);
          const initialLink = document.querySelector(\`.sidebar-menu a[data-target-id="\${initialHash}"]\`);
          if (initialLink) { showContent(initialHash); }
          else if (links.length > 0) { showContent(links[0].getAttribute('data-target-id')); }
        });
      </script>`;

      const fullHtml = `</html>
<!DOCTYPE html>
<html lang="en" data-theme="light">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation Export</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { padding: 1.5rem; background-color: hsl(var(--b2));}
    .main-container {display: flex;gap: 1.5rem;margin: auto;}
    .sidebar {flex-shrink: 0;width: 25%;height: fit-content;position: sticky;top: 1.5rem;}
    .main-content {flex-grow: 1;min-width: 0;}
    .sidebar-menu ul {padding-left: 1rem;}
    .sidebar-menu a.active {background-color: hsl(var(--p));color: hsl(var(--pc));}
  </style>
</head>

<body>
  <div class="mx-auto">
    <h1 class="text-4xl font-bold mb-6 text-center">Generated Documentation</h1>
    <div class="main-container">${sidebarHtml}${finalContentHtml}</div>
  </div>${script}
</body>

</html>`;

      // 6. Buat Blob dari HTML final dan picu download
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

  return (
    // 1. Kontainer utama diubah menjadi flex-col dengan tinggi penuh
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end mb-4 flex-shrink-0">
        <button className="btn btn-primary" onClick={handleExportToHTML} disabled={isExporting}>
          {isExporting && <span className="loading loading-spinner"></span>}
          Export to HTML
        </button>
      </div>

      {/* 2. Kontainer untuk sidebar dan konten, mengisi sisa ruang */}
      <div className="flex gap-6 flex-grow min-h-0">

        {/* 3. Sidebar diubah menjadi flex-col */}
        <aside className="lg:w-1/4 bg-base-200 rounded-box p-2 h-full flex flex-col">
          <h3 className="text-lg font-bold p-4 flex-shrink-0">Code Components</h3>

          {/* 4. Wrapper baru untuk membuat HANYA daftar menu yang bisa di-scroll */}
          <div className="overflow-y-auto flex-grow max-h-screen">
            <ul className="menu bg-base-200 rounded-box w-full">
              {components.map(comp => (
                <SidebarMenuItem
                  key={comp.id}
                  component={comp}
                  selectedComponentId={selectedComponentId}
                  onSelect={setSelectedComponentId}
                />
              ))}
            </ul>
          </div>
        </aside>

        {/* 5. Konten utama sekarang memiliki overflow-y-auto sendiri */}
        <main className="lg:w-3/4 overflow-y-auto h-full pr-2 max-h-screen">
          {selectedComponent ? <ComponentDocumentation component={selectedComponent} /> :
            <div className="flex items-center justify-center h-full bg-base-200 rounded-lg p-8">
              <p>Select a component to view its documentation.</p>
            </div>
          }
        </main>
      </div>
    </div>
  );
}

export default DocumentationWebPreview;
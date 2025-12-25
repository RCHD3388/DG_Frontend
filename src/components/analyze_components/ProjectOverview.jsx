import React, { useMemo, useState } from 'react';
import { 
  Folder, FileCode, Box, Code2, Layers, 
  ChevronRight, Activity, GitBranch, Terminal,
  Hash, Clock, Search, BookOpen, AlertCircle, Link, Subtitles
} from 'lucide-react';

// --- Helper Functions ---

// Fungsi rekursif untuk mengambil semua komponen termasuk yang ada di dalam class
const flattenComponents = (components) => {
  let flat = [];
  if (!components) return flat;

  components.forEach(comp => {
    flat.push(comp);
    if (comp.method_components && comp.method_components.length > 0) {
      // Rekursi untuk mengambil method di dalam class
      flat = [...flat, ...flattenComponents(comp.method_components)];
    }
  });
  return flat;
};

const processData = (rawComponents) => {
  if (!rawComponents) return { stats: {}, tree: {}, folderFileCount: {}, allFlatComponents: [] };

  // 1. Flatten semua komponen (termasuk method di dalam class)
  const allFlatComponents = flattenComponents(rawComponents);

  // 2. Hitung Statistik
  const stats = {
    totalFiles: new Set(allFlatComponents.map(c => c.relative_path)).size,
    totalFolders: new Set(allFlatComponents.map(c => c.relative_path.includes('\\') 
      ? c.relative_path.split('\\').slice(0, -1).join('\\') 
      : 'root')).size,
    totalComponents: allFlatComponents.length,
    classes: allFlatComponents.filter(c => c.component_type === 'class').length,
    functions: allFlatComponents.filter(c => 
      c.component_type === 'function' || 
      c.component_type === 'method' || 
      c.component_type === 'constructor'
    ).length,
  };

  // 3. Bangun Tree (berdasarkan komponen tingkat atas saja agar tidak duplikat di sidebar)
  const tree = {};
  const folderFileCount = {};

  rawComponents.forEach(comp => {
    const parts = comp.relative_path.split('\\');
    let current = tree;
    
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      if (!current[part]) {
        current[part] = isFile ? { _isFile: true, path: comp.relative_path } : { _isFolder: true, children: {} };
      }
      if (!isFile) {
        const folderPath = parts.slice(0, i + 1).join('\\');
        if (!folderFileCount[folderPath]) folderFileCount[folderPath] = new Set();
        folderFileCount[folderPath].add(comp.relative_path);
      }
      current = isFile ? current[part] : current[part].children;
    });
  });

  return { stats, tree, folderFileCount, allFlatComponents };
};

// --- Komponen Dashboard Utama ---
function ProjectOverview({ documentationData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { stats, tree, folderFileCount, allFlatComponents } = useMemo(() => 
    processData(documentationData?.components), [documentationData]
  );

  const filteredComponents = useMemo(() => {
    let base = allFlatComponents || [];
    if (selectedFile) {
      base = base.filter(c => c.relative_path === selectedFile);
    }
    return base.filter(c => c.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedFile, allFlatComponents, searchTerm]);

  const renderVisualTree = (nodes, path = "") => {
    return Object.entries(nodes)
      .sort(([a, nodeA], [b, nodeB]) => (nodeB._isFolder ? 1 : -1) - (nodeA._isFolder ? 1 : -1))
      .map(([name, node]) => {
        const currentPath = path ? `${path}\\${name}` : name;
        
        if (node._isFolder) {
          return (
            <details key={name} className="group" open>
              <summary className="flex items-center gap-2 py-1.5 px-3 hover:bg-base-200 rounded-lg cursor-pointer transition-all text-base-content/80">
                <Folder size={16} className="text-warning fill-warning/20" />
                <span className="text-sm font-medium flex-1 truncate">{name}</span>
                <span className="badge badge-ghost badge-xs opacity-50">{folderFileCount[currentPath]?.size}</span>
              </summary>
              <div className="ml-4 border-l border-base-content/10 pl-3">
                {renderVisualTree(node.children, currentPath)}
              </div>
            </details>
          );
        }
        return (
          <div 
            key={name} 
            onClick={() => setSelectedFile(node.path)}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all group mb-0.5 ${
              selectedFile === node.path 
                ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
                : 'hover:bg-base-200 text-base-content/70'
            }`}
          >
            <FileCode size={14} className={selectedFile === node.path ? 'text-primary-content' : 'text-primary'} />
            <span className="text-sm flex-1 truncate">{name}</span>
          </div>
        );
      });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 bg-base-200/20 min-h-screen text-base-content font-sans">
      
      {/* 1. Intro Section */}
      <section className="bg-base-100 p-8 rounded-[2rem] border border-base-content/5 shadow-sm relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <BookOpen size={120} />
        </div>
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
            <Activity size={16} /> Technical Analysis Report
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-base-content">
            {documentationData?.name || "Project Overview"}
          </h1>
          <p className="text-base-content/70 leading-relaxed text-lg">
            Selamat datang di dokumen teknis proyek '{documentationData?.name}'. Dokumen ini menyajikan struktur hierarki mendalam dari proyek tersebut, memetakan hubungan antar file, serta mendokumentasikan setiap unit logika yang ditemukan termasuk class dan function atau methods yang terdefinisi secara internal. Analisis ini dirancang untuk mempermudah navigasi basis kode dan mempercepat proses pemahaman pengembang.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <span className="flex items-center gap-1.5 bg-base-200 px-3 py-1 rounded-full opacity-70 text-xs"><Clock size={14}/> {documentationData?.meta_information?.execution_time?.formatted} Duration</span>
            <span className="flex items-center gap-1.5 bg-base-200 px-3 py-1 rounded-full opacity-70 text-xs"><Hash size={14}/> Ref: {documentationData?._id?.slice(0,8)}</span>
          </div>
        </div>
      </section>

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Files", val: stats.totalFiles, sub: `${stats.totalFolders} Directories`, ic: Folder, col: "bg-primary" },
          { title: "Total Components", val: stats.totalComponents, sub: "Inc. methods in classes", ic: Layers, col: "bg-secondary" },
          { title: "Class Components", val: stats.classes, sub: "Object structures", ic: Box, col: "bg-accent" },
          { title: "Functions/Methods", val: stats.functions, sub: "Logical units", ic: Code2, col: "bg-info" },
        ].map((s, i) => (
          <div key={i} className="bg-base-100 p-6 rounded-2xl border border-base-content/5 shadow-sm">
            <div className="flex justify-between items-start text-left">
              <div>
                <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-[0.2em]">{s.title}</p>
                <h3 className="text-3xl font-black mt-1 tracking-tight">{s.val}</h3>
                <p className="text-xs mt-1 font-medium opacity-60">{s.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.col} bg-opacity-10 ${s.col.replace('bg-', 'text-')}`}>
                <s.ic size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Interactive Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
        
        {/* Structure Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                <GitBranch size={16} /> Directory Structure
             </h2>
             {selectedFile && (
               <button onClick={() => setSelectedFile(null)} className="btn btn-ghost btn-xs text-primary underline normal-case">Reset View</button>
             )}
          </div>
          <div className="bg-base-100 rounded-3xl p-5 border border-base-content/5 shadow-xl max-h-[650px] overflow-y-auto custom-scrollbar">
            <div className="menu menu-compact p-0">
              {renderVisualTree(tree)}
            </div>
          </div>
        </div>

        {/* Component Inspector Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
             <h2 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2 text-secondary">
                <Terminal size={16} /> 
                {selectedFile ? `Components in ${selectedFile.split('\\').pop()}` : "Global Component List"}
             </h2>
             <div className="join shadow-sm border border-base-content/5 bg-base-100">
                <div className="px-3 flex items-center">
                  <Search size={14} className="opacity-40" />
                </div>
                <input 
                  className="input input-sm join-item focus:outline-none w-full md:w-64 bg-transparent" 
                  placeholder="Filter by name..." 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredComponents.length > 0 ? (
              filteredComponents.map((comp) => {
                const shortSummary = comp.docgen_final_state?.final_state?.documentation_json?.short_summary;
                const totalDeps = (comp.depends_on?.length || 0) + (comp.used_by?.length || 0);
                const isMethod = comp.component_type === 'method';

                return (
                  <div key={comp.id} className="group card bg-base-100 border border-base-content/5 shadow-sm hover:border-primary/40 transition-all overflow-hidden">
                    <div className="flex">
                      <div className={`w-1.5 ${comp.component_type === 'class' ? 'bg-accent' : 'bg-info'}`}></div>
                      <div className="p-5 flex-1 space-y-4">
                        
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                              comp.component_type === 'class' ? 'bg-accent/10 text-accent' : 'bg-info/10 text-info'
                            }`}>
                              {comp.component_type}
                            </span>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-base font-mono truncate">
                                    {comp.id.split('.').pop()}
                                </h3>
                                {isMethod && (
                                    <span className="text-[9px] opacity-40 font-mono -mt-1">
                                        Member of: {comp.id.split('.').slice(-2, -1)}
                                    </span>
                                )}
                            </div>
                          </div>
                          <div className="text-[10px] font-mono font-bold opacity-40 bg-base-200 px-2 py-1 rounded">
                            Line {comp.start_line} - {comp.end_line}
                          </div>
                        </div>

                        <div className="bg-base-200/30 p-4 rounded-xl border border-base-content/5">
                          <p className="text-sm text-base-content/70 leading-relaxed italic">
                            {shortSummary || "Tidak ada ringkasan dokumentasi yang tersedia untuk komponen ini."}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs font-semibold opacity-60">
                            <Link size={14} />
                            <span>Terdapat <span className="text-base-content font-bold">{totalDeps}</span> ketergantungan kode</span>
                          </div>
                          <div className="h-1 w-1 bg-base-content/20 rounded-full"></div>
                          {!selectedFile && (
                            <div className="text-[10px] font-mono opacity-40 truncate flex-1">
                                Path: {comp.relative_path}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-64 opacity-20 border-2 border-dashed border-base-content/20 rounded-3xl">
                <AlertCircle size={48} />
                <p className="mt-4 font-bold italic uppercase tracking-widest text-sm">No components found in this scope</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectOverview;
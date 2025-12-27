import { useState } from 'react';
import axios from 'axios';
import { Download, ChevronDown, ChevronRight, Loader2, Search, Globe, Layers, MousePointer } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './index.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const apiUrl = import.meta.env.DEV ? 'http://localhost:8000/scrape' : '/scrape';
      const res = await axios.post(apiUrl, { url });
      setData(res.data.result);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleScrape();
  }

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'scrape_result.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6 md:p-12 font-sans antialiased">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-start to-accent-end mb-4">
            Universal Web Scraper
          </h1>
          <p className="text-dark-400 text-lg md:text-xl max-w-2xl mx-auto">
            Extract static and dynamic content, analyze structures, and capture interactions with a single click.
          </p>
        </div>
        
        {/* Input Section */}
        <div className="mb-10 animate-fade-in" style={{animationDelay: '100ms'}}>
          <div className="flex relative group rounded-2xl overflow-hidden shadow-2xl shadow-accent-start/10 ring-1 ring-dark-700 focus-within:ring-2 focus-within:ring-accent-start transition-all">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-dark-400" size={20} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://example.com/amazing-page"
              className="flex-1 bg-dark-900 text-dark-200 p-4 pl-12 outline-none placeholder-dark-700 w-full"
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url}
              className="bg-gradient-to-r from-accent-start to-accent-end text-white px-8 py-4 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[160px] justify-center relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-3" size={22} />
                  Processing...
                </>
              ) : (
                <>
                  Scrape URL
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-950/30 border border-red-500/50 text-red-300 rounded-xl flex items-center animate-fade-in">
              <div className="mr-3 text-red-500">⚠️</div>
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {data && (
          <div className="bg-dark-900 rounded-2xl shadow-xl border border-dark-800 overflow-hidden animate-fade-in">
            
            {/* Meta Header */}
            <div className="p-6 md:p-8 border-b border-dark-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-dark-900 to-dark-950">
              <div className="flex-1">
                <div className="flex items-center text-accent-start mb-2">
                  <Globe size={16} className="mr-2"/>
                  <span className="text-xs font-mono uppercase tracking-wider">Page Metadata</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{data.meta.title || "No Title Found"}</h2>
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-dark-400 text-sm hover:text-accent-start transition-colors truncate block max-w-xl font-mono">
                  {data.url}
                </a>
              </div>
              <button 
                onClick={downloadJson} 
                className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-5 py-2.5 rounded-lg border border-dark-700 transition-all text-sm font-medium shrink-0"
              >
                <Download size={18} /> Download Full JSON
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-semibold text-white flex items-center">
                   <Layers className="mr-3 text-accent-start" size={20}/>
                   Scraped Sections 
                   <span className="ml-3 bg-dark-800 text-dark-400 text-xs font-mono py-1 px-2 rounded-full">{data.sections.length} found</span>
                 </h3>
                 <div className="text-dark-400 text-sm flex items-center bg-dark-950 py-1 px-3 rounded-full border border-dark-800">
                    <MousePointer size={14} className="mr-2 text-accent-end"/>
                    <span>Interactions: <b>{data.interactions.scrolls}</b> scrolls, <b>{data.interactions.clicks.length}</b> clicks</span>
                 </div>
              </div>

              {/* Sections Accordion */}
              <div className="space-y-3">
                {data.sections.map((section) => {
                  const isExpanded = expandedSection === section.id;
                  return (
                  <div key={section.id} className={`border transition-all rounded-xl overflow-hidden ${isExpanded ? 'border-accent-start/50 bg-dark-950/50' : 'border-dark-800 bg-dark-800/30 hover:border-dark-700'}`}>
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="w-full flex justify-between items-center p-4 text-left"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono shrink-0 ${isExpanded ? 'bg-accent-start text-white' : 'bg-dark-700 text-dark-400'}`}>
                          {section.type}
                        </span>
                        <span className="font-medium text-dark-200 truncate">{section.label}</span>
                      </div>
                      <div className={`text-dark-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-accent-start' : ''}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-6 border-t border-dark-800/50 bg-dark-950/30 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        
                        {/* Left Col: Preview & Stats */}
                        <div className="lg:col-span-1 space-y-6">
                          <div>
                            <h4 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-2">Text Content Preview</h4>
                            <p className="text-dark-200 text-sm leading-relaxed bg-dark-900 p-3 rounded-lg border border-dark-800 font-mono">
                              {section.content.text ? `"${section.content.text.substring(0, 200)}${section.content.text.length > 200 ? '...' : ''}"` : <span className="text-dark-700 italic">Empty text content</span>}
                            </p>
                          </div>
                          
                          <div>
                             <h4 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-2">Data Detected</h4>
                             <div className="grid grid-cols-2 gap-2">
                                <StatBox label="Headings" count={section.content.headings.length} />
                                <StatBox label="Links" count={section.content.links.length} />
                                <StatBox label="Images" count={section.content.images.length} />
                                <StatBox label="Lists" count={section.content.lists.length} />
                                <StatBox label="Tables" count={section.content.tables.length} />
                                <div className={`p-3 rounded-lg border ${section.truncated ? 'bg-amber-900/20 border-amber-700/50 text-amber-500' : 'bg-dark-900 border-dark-800 text-dark-400'} text-center`}>
                                  <div className="text-xl font-bold">{section.truncated ? 'Yes' : 'No'}</div>
                                  <div className="text-xs uppercase tracking-wider mt-1">HTML Truncated</div>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Right Col: JSON Viewer */}
                        <div className="lg:col-span-2">
                          <div className="flex justify-between items-center mb-2">
                             <h4 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">Section JSON Object</h4>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-dark-800">
                            {/* Using react-syntax-highlighter for beautiful JSON display */}
                            <SyntaxHighlighter 
                              language="json" 
                              style={atomDark}
                              customStyle={{margin: 0, background: '#0f172a', fontSize: '0.8rem', maxHeight: '400px'}}
                              wrapLongLines={true}
                            >
                              {JSON.stringify(section, null, 2)}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for stats stats
function StatBox({ label, count }) {
  return (
    <div className={`p-3 rounded-lg border ${count > 0 ? 'bg-dark-900 border-dark-700 text-dark-200' : 'bg-dark-950 border-dark-800 text-dark-700'} text-center`}>
      <div className={`text-xl font-bold ${count > 0 ? 'text-accent-start' : ''}`}>{count}</div>
      <div className="text-xs uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

export default App;

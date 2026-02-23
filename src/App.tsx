import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Upload, Database, Settings, Filter, Search, Activity, Box, Map, Shield, Calendar, BarChart2, MessageSquare, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { NetworkGraph } from './components/NetworkGraph';
import { CategoryChart, LicenseChart, ModelChart, CustomerChart, TimelineChart, SupplierVolumeChart, LotNumberChart, DeviceNameChart } from './components/Charts';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
export interface DeviceRecord {
  SupplierID: string;
  Deliverdate: string;
  CustomerID: string;
  LicenseNo: string;
  Category: string;
  UDID: string;
  DeviceNAME: string;
  LotNO: string;
  SerNo: string;
  Model: string;
  Number: string;
  [key: string]: any;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
];

const FOLLOW_UP_QUESTIONS = [
  "What is the overall distribution trend over time?",
  "Which supplier has the highest volume of deliveries?",
  "What are the most common device categories?",
  "Which customer receives the most diverse set of models?",
  "Are there any anomalies in the delivery dates?",
  "What is the distribution of licenses across different categories?",
  "Which models are most frequently distributed?",
  "How many unique lot numbers are currently in the dataset?",
  "What is the average number of items per delivery?",
  "Which supplier provides the widest range of categories?",
  "Are there specific customers that only buy from one supplier?",
  "What is the relationship between device names and models?",
  "How does the distribution volume vary by month?",
  "Which license numbers are associated with the most models?",
  "What are the top 3 most active customers?",
  "Is there a correlation between lot numbers and delivery dates?",
  "Which categories have the highest number of unique models?",
  "Can you identify any seasonal patterns in the deliveries?",
  "What is the distribution of serial numbers for the top model?",
  "Which supplier-customer pairs have the highest transaction volume?"
];

export default function App() {
  const [data, setData] = useState<DeviceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCount, setPreviewCount] = useState(20);
  
  // Filters
  const [filters, setFilters] = useState({
    SupplierID: '',
    Category: '',
    LicenseNo: '',
    Model: '',
    CustomerID: '',
    LotNO: '',
    SerNo: '',
  });

  // AI Summary
  const [summaryPrompt, setSummaryPrompt] = useState('Analyze this medical device distribution dataset and provide key insights regarding supplier distribution, categories, and customers.');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Node Details
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{type: string, id: string, label: string} | null>(null);

  useEffect(() => {
    // Load default dataset
    fetch('/defaultdataset.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data as DeviceRecord[]);
            setFilteredData(results.data as DeviceRecord[]);
            setLoading(false);
          }
        });
      });
  }, []);

  useEffect(() => {
    // Apply filters
    let result = data;
    if (filters.SupplierID) result = result.filter(d => d.SupplierID?.toLowerCase().includes(filters.SupplierID.toLowerCase()));
    if (filters.Category) result = result.filter(d => d.Category?.toLowerCase().includes(filters.Category.toLowerCase()));
    if (filters.LicenseNo) result = result.filter(d => d.LicenseNo?.toLowerCase().includes(filters.LicenseNo.toLowerCase()));
    if (filters.Model) result = result.filter(d => d.Model?.toLowerCase().includes(filters.Model.toLowerCase()));
    if (filters.CustomerID) result = result.filter(d => d.CustomerID?.toLowerCase().includes(filters.CustomerID.toLowerCase()));
    if (filters.LotNO) result = result.filter(d => d.LotNO?.toLowerCase().includes(filters.LotNO.toLowerCase()));
    if (filters.SerNo) result = result.filter(d => d.SerNo?.toLowerCase().includes(filters.SerNo.toLowerCase()));
    setFilteredData(result);
  }, [data, filters]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data as DeviceRecord[]);
        setFilteredData(results.data as DeviceRecord[]);
        setLoading(false);
      }
    });
  };

  const generateSummary = async () => {
    if (!filteredData.length) return;
    setIsGeneratingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const dataSample = JSON.stringify(filteredData.slice(0, 50)); // Send a sample to avoid token limits
      const prompt = `${summaryPrompt}\n\nDataset Sample:\n${dataSample}`;
      
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });
      
      setSummary(response.text || 'No summary generated.');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please check your API key and try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleChat = async () => {
    if (!chatPrompt.trim()) return;
    
    const newHistory = [...chatHistory, { role: 'user', text: chatPrompt }];
    setChatHistory(newHistory);
    setChatPrompt('');
    setIsChatting(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const dataSample = JSON.stringify(filteredData.slice(0, 20));
      
      const prompt = `Context: You are an AI assistant analyzing a medical device dataset. Here is a sample of the current filtered data:\n${dataSample}\n\nUser Query: ${chatPrompt}`;
      
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });
      
      setChatHistory([...newHistory, { role: 'assistant', text: response.text || 'No response.' }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setChatHistory([...newHistory, { role: 'assistant', text: 'Error generating response.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const uniqueSuppliers = useMemo(() => Array.from(new Set(data.map(d => d.SupplierID).filter(Boolean))), [data]);
  const uniqueCategories = useMemo(() => Array.from(new Set(data.map(d => d.Category).filter(Boolean))), [data]);
  const uniqueCustomers = useMemo(() => Array.from(new Set(data.map(d => d.CustomerID).filter(Boolean))), [data]);
  const uniqueLicenses = useMemo(() => Array.from(new Set(data.map(d => d.LicenseNo).filter(Boolean))), [data]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/10 bg-[#0a0a0a] flex flex-col h-screen overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-[#00FF00]" />
            <h1 className="text-xl font-bold tracking-tight uppercase">MedDistro AI</h1>
          </div>
          <p className="text-xs text-white/50 font-mono uppercase tracking-wider">Distribution Analysis System</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Data Source */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4" /> Data Source
            </h2>
            <label className="block w-full p-4 border border-dashed border-white/20 rounded-xl hover:border-[#00FF00] hover:bg-[#00FF00]/5 transition-colors cursor-pointer text-center">
              <Upload className="w-5 h-5 mx-auto mb-2 text-white/50" />
              <span className="text-sm text-white/70">Upload CSV/JSON</span>
              <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="text-xs text-white/40 font-mono text-center">
              Currently loaded: {data.length} records
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Supplier ID</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.SupplierID}
                  onChange={e => setFilters({...filters, SupplierID: e.target.value})}
                >
                  <option value="">All Suppliers</option>
                  {uniqueSuppliers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Category</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.Category}
                  onChange={e => setFilters({...filters, Category: e.target.value})}
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c.length > 30 ? c.substring(0,30)+'...' : c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Customer ID</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.CustomerID}
                  onChange={e => setFilters({...filters, CustomerID: e.target.value})}
                >
                  <option value="">All Customers</option>
                  {uniqueCustomers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">License No</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.LicenseNo}
                  onChange={e => setFilters({...filters, LicenseNo: e.target.value})}
                >
                  <option value="">All Licenses</option>
                  {uniqueLicenses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Model</label>
                <input 
                  type="text"
                  placeholder="e.g. L111"
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.Model}
                  onChange={e => setFilters({...filters, Model: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Lot No</label>
                <input 
                  type="text"
                  placeholder="e.g. 890057"
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.LotNO}
                  onChange={e => setFilters({...filters, LotNO: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Serial No</label>
                <input 
                  type="text"
                  placeholder="e.g. 19"
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                  value={filters.SerNo}
                  onChange={e => setFilters({...filters, SerNo: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4" /> AI Settings
            </h2>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/50 mb-1 block">Model</label>
              <select 
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm focus:border-[#00FF00] outline-none"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              >
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#050505]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FF00]"></div>
          </div>
        ) : (
          <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
            
            {/* Header Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Records', value: filteredData.length },
                { label: 'Suppliers', value: new Set(filteredData.map(d => d.SupplierID)).size },
                { label: 'Categories', value: new Set(filteredData.map(d => d.Category)).size },
                { label: 'Customers', value: new Set(filteredData.map(d => d.CustomerID)).size },
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-[#111] border border-white/10 rounded-2xl p-6"
                >
                  <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">{stat.label}</div>
                  <div className="text-4xl font-light font-mono">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* AI Summary Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00FF00]" /> AI Analysis
                </h2>
                <button 
                  onClick={generateSummary}
                  disabled={isGeneratingSummary}
                  className="bg-[#00FF00] text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#00cc00] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingSummary ? 'Generating...' : 'Generate Summary'} <Play className="w-3 h-3" />
                </button>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={summaryPrompt}
                  onChange={(e) => setSummaryPrompt(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-[#00FF00] outline-none min-h-[80px] font-mono text-white/70"
                  placeholder="Enter prompt for summary..."
                />
                
                {summary && (
                  <div className="p-6 bg-black/50 border border-white/5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Infographics Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {/* 1. Network Graph */}
              <div className="xl:col-span-3 bg-[#111] border border-white/10 rounded-2xl p-6 min-h-[400px] flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Map className="w-4 h-4" /> Distribution Network
                </h3>
                <div className="flex-1 relative">
                  <NetworkGraph data={filteredData} onNodeClick={setSelectedNodeDetails} />
                </div>
              </div>

              {/* 2. Category */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Categories
                </h3>
                <div className="flex-1">
                  <CategoryChart data={filteredData} />
                </div>
              </div>

              {/* 3. License No */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Top Licenses
                </h3>
                <div className="flex-1">
                  <LicenseChart data={filteredData} />
                </div>
              </div>

              {/* 4. Model */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Models
                </h3>
                <div className="flex-1">
                  <ModelChart data={filteredData} />
                </div>
              </div>

              {/* 5. Customer */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Top Customers
                </h3>
                <div className="flex-1">
                  <CustomerChart data={filteredData} />
                </div>
              </div>

              {/* 6. Supplier Volume */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Supplier Volume
                </h3>
                <div className="flex-1">
                  <SupplierVolumeChart data={filteredData} />
                </div>
              </div>

              {/* 7. Lot Numbers */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Top Lot Numbers
                </h3>
                <div className="flex-1">
                  <LotNumberChart data={filteredData} />
                </div>
              </div>

              {/* 8. Device Names */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Device Names
                </h3>
                <div className="flex-1">
                  <DeviceNameChart data={filteredData} />
                </div>
              </div>

              {/* 9. Timeline */}
              <div className="xl:col-span-3 bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Delivery Timeline
                </h3>
                <div className="flex-1 h-[300px]">
                  <TimelineChart data={filteredData} />
                </div>
              </div>
            </motion.div>

            {/* Data Preview Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Data Preview
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Show</span>
                  <select 
                    className="bg-black border border-white/10 rounded px-2 py-1 text-xs outline-none"
                    value={previewCount}
                    onChange={(e) => setPreviewCount(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/50 text-[10px] uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="p-4 font-medium">Supplier ID</th>
                      <th className="p-4 font-medium">Deliver Date</th>
                      <th className="p-4 font-medium">Customer ID</th>
                      <th className="p-4 font-medium">License No</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredData.slice(0, previewCount).map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-xs text-white/70">{row.SupplierID}</td>
                        <td className="p-4 font-mono text-xs">{row.Deliverdate}</td>
                        <td className="p-4 font-mono text-xs">{row.CustomerID}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-white/10 text-[10px] font-mono">
                            {row.LicenseNo}
                          </span>
                        </td>
                        <td className="p-4 text-xs">{row.Category ? (row.Category.length > 30 ? row.Category.substring(0, 30) + '...' : row.Category) : ''}</td>
                        <td className="p-4 font-mono text-xs">{row.Model}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Chat Interface */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col h-[500px]"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Dataset Assistant
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/30 text-sm italic">
                    Ask questions about the filtered dataset...
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={cn(
                      "p-4 rounded-xl max-w-[80%] text-sm",
                      msg.role === 'user' 
                        ? "bg-[#00FF00]/10 border border-[#00FF00]/20 ml-auto text-right" 
                        : "bg-white/5 border border-white/10 mr-auto"
                    )}>
                      <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="bg-white/5 border border-white/10 mr-auto p-4 rounded-xl max-w-[80%] text-sm">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={chatPrompt}
                  onChange={e => setChatPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none"
                />
                <button 
                  onClick={handleChat}
                  disabled={isChatting || !chatPrompt.trim()}
                  className="bg-[#00FF00] text-black px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#00cc00] transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                {FOLLOW_UP_QUESTIONS.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => setChatPrompt(q)}
                    className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 text-[10px] text-white/70 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>

          </div>
        )}
      </main>

      {/* Node Details Modal */}
      {selectedNodeDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00FF00]" />
                Node Details: {selectedNodeDetails.label}
              </h3>
              <button onClick={() => setSelectedNodeDetails(null)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="text-sm text-white/70 mb-4">
                <span className="font-bold text-white">Type:</span> {selectedNodeDetails.type} <br/>
                <span className="font-bold text-white">ID:</span> {selectedNodeDetails.id}
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Related Records</h4>
              <div className="space-y-2">
                {filteredData.filter(d => d[selectedNodeDetails.type] === selectedNodeDetails.id).map((record, i) => (
                  <div key={i} className="bg-black/50 border border-white/5 p-3 rounded-lg text-xs font-mono text-white/70">
                    <div>Supplier: {record.SupplierID} | Customer: {record.CustomerID}</div>
                    <div>Model: {record.Model} | License: {record.LicenseNo}</div>
                    <div className="text-white/40 truncate">{record.Category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

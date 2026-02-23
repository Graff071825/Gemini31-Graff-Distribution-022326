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

const PANTONE_COLORS = [
  { name: 'Classic Blue', hex: '#0F4C81' },
  { name: 'Living Coral', hex: '#FF6F61' },
  { name: 'Ultra Violet', hex: '#5F4B8B' },
  { name: 'Greenery', hex: '#88B04B' },
  { name: 'Rose Quartz', hex: '#F7CAC9' },
  { name: 'Serenity', hex: '#92A8D1' },
  { name: 'Marsala', hex: '#955251' },
  { name: 'Radiant Orchid', hex: '#B565A7' },
  { name: 'Emerald', hex: '#009B77' },
  { name: 'Tangerine Tango', hex: '#DD4124' }
];

const TRANSLATIONS = {
  en: {
    appTitle: "MedDistro AI",
    appSubtitle: "Distribution Analysis System",
    dataSource: "Data Source",
    uploadFile: "Upload CSV/JSON",
    currentlyLoaded: "Currently loaded: {count} records",
    filters: "Filters",
    supplierId: "Supplier ID",
    allSuppliers: "All Suppliers",
    category: "Category",
    allCategories: "All Categories",
    customerId: "Customer ID",
    allCustomers: "All Customers",
    licenseNo: "License No",
    allLicenses: "All Licenses",
    model: "Model",
    lotNo: "Lot No",
    serialNo: "Serial No",
    aiSettings: "AI Settings",
    aiModel: "AI Model",
    totalRecords: "Total Records",
    suppliers: "Suppliers",
    categories: "Categories",
    customers: "Customers",
    aiAnalysis: "AI Analysis",
    generateSummary: "Generate Summary",
    generating: "Generating...",
    summaryPromptPlaceholder: "Enter prompt for summary...",
    distNetwork: "Distribution Network",
    topLicenses: "Top Licenses",
    models: "Models",
    topCustomers: "Top Customers",
    supplierVolume: "Supplier Volume",
    topLotNumbers: "Top Lot Numbers",
    deviceNames: "Device Names",
    deliveryTimeline: "Delivery Timeline",
    dataPreview: "Data Preview",
    show: "Show",
    deliverDate: "Deliver Date",
    datasetAssistant: "Dataset Assistant",
    askQuestions: "Ask questions about the filtered dataset...",
    askQuestionPlaceholder: "Ask a question...",
    send: "Send",
    you: "You",
    aiAssistant: "AI Assistant",
    nodeDetails: "Node Details",
    type: "Type",
    id: "ID",
    relatedRecords: "Related Records",
    supplier: "Supplier",
    customer: "Customer",
    license: "License",
    theme: "Theme",
    language: "Language",
    colorStyle: "Color Style",
    light: "Light",
    dark: "Dark",
    preferences: "Preferences"
  },
  'zh-TW': {
    appTitle: "醫療器材分銷 AI",
    appSubtitle: "分銷分析系統",
    dataSource: "資料來源",
    uploadFile: "上傳 CSV/JSON",
    currentlyLoaded: "目前載入：{count} 筆紀錄",
    filters: "篩選器",
    supplierId: "供應商 ID",
    allSuppliers: "所有供應商",
    category: "類別",
    allCategories: "所有類別",
    customerId: "客戶 ID",
    allCustomers: "所有客戶",
    licenseNo: "許可證字號",
    allLicenses: "所有許可證",
    model: "型號",
    lotNo: "批號",
    serialNo: "序號",
    aiSettings: "AI 設定",
    aiModel: "AI 模型",
    totalRecords: "總紀錄數",
    suppliers: "供應商數",
    categories: "類別數",
    customers: "客戶數",
    aiAnalysis: "AI 分析",
    generateSummary: "產生摘要",
    generating: "產生中...",
    summaryPromptPlaceholder: "輸入摘要提示...",
    distNetwork: "分銷網絡",
    topLicenses: "熱門許可證",
    models: "型號分佈",
    topCustomers: "主要客戶",
    supplierVolume: "供應商出貨量",
    topLotNumbers: "熱門批號",
    deviceNames: "設備名稱",
    deliveryTimeline: "交貨時間線",
    dataPreview: "資料預覽",
    show: "顯示",
    deliverDate: "交貨日期",
    datasetAssistant: "資料集助手",
    askQuestions: "詢問關於篩選後資料集的問題...",
    askQuestionPlaceholder: "問一個問題...",
    send: "發送",
    you: "你",
    aiAssistant: "AI 助手",
    nodeDetails: "節點詳情",
    type: "類型",
    id: "ID",
    relatedRecords: "相關紀錄",
    supplier: "供應商",
    customer: "客戶",
    license: "許可證",
    theme: "主題",
    language: "語言",
    colorStyle: "色彩風格",
    light: "淺色",
    dark: "深色",
    preferences: "偏好設定"
  }
};

const FOLLOW_UP_QUESTIONS = {
  en: [
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
  ],
  'zh-TW': [
    "隨時間推移的整體分銷趨勢為何？",
    "哪個供應商的交貨量最高？",
    "最常見的設備類別有哪些？",
    "哪個客戶收到最多樣化的型號？",
    "交貨日期是否有任何異常？",
    "不同類別的許可證分佈情況為何？",
    "哪些型號的分銷頻率最高？",
    "目前資料集中有多少個獨特的批號？",
    "每次交貨的平均項目數量是多少？",
    "哪個供應商提供最廣泛的類別？",
    "是否有特定客戶只向單一供應商購買？",
    "設備名稱和型號之間的關係為何？",
    "分銷量如何隨月份變化？",
    "哪些許可證號碼關聯了最多的型號？",
    "最活躍的前三大客戶是誰？",
    "批號和交貨日期之間是否有相關性？",
    "哪些類別擁有最多數量的獨特型號？",
    "您能找出交貨中的任何季節性模式嗎？",
    "最熱門型號的序號分佈為何？",
    "哪些供應商-客戶對的交易量最高？"
  ]
};

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 255, 0';
}

export default function App() {
  const [data, setData] = useState<DeviceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCount, setPreviewCount] = useState(20);
  
  // UI State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<'en' | 'zh-TW'>('en');
  const [accentColor, setAccentColor] = useState(PANTONE_COLORS[0].hex);

  const t = TRANSLATIONS[language];

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
      const dataSample = JSON.stringify(filteredData.slice(0, 50));
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

  const themeVars = theme === 'dark' ? {
    '--bg-main': '#050505',
    '--bg-sidebar': '#0a0a0a',
    '--bg-card': '#111111',
    '--text-main': '#ffffff',
    '--text-muted': 'rgba(255, 255, 255, 0.5)',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--border-color-hover': 'rgba(255, 255, 255, 0.2)',
    '--bg-input': '#000000',
    '--bg-hover': 'rgba(255, 255, 255, 0.05)',
  } : {
    '--bg-main': '#f5f5f5',
    '--bg-sidebar': '#ffffff',
    '--bg-card': '#ffffff',
    '--text-main': '#111111',
    '--text-muted': 'rgba(0, 0, 0, 0.5)',
    '--border-color': 'rgba(0, 0, 0, 0.1)',
    '--border-color-hover': 'rgba(0, 0, 0, 0.2)',
    '--bg-input': '#ffffff',
    '--bg-hover': 'rgba(0, 0, 0, 0.05)',
  };

  const rgb = hexToRgb(accentColor);
  const style = {
    ...themeVars,
    '--accent-color': accentColor,
    '--accent-rgb': rgb,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex overflow-hidden transition-colors duration-300" style={style}>
      {/* Sidebar */}
      <aside className="w-80 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col h-screen overflow-y-auto">
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-[var(--accent-color)]" />
            <h1 className="text-xl font-bold tracking-tight uppercase">{t.appTitle}</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">{t.appSubtitle}</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Preferences */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4" /> {t.preferences}
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.theme}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTheme('light')}
                    className={cn("flex-1 py-1 px-2 rounded text-xs border transition-colors", theme === 'light' ? "border-[var(--accent-color)] text-[var(--accent-color)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-color-hover)]")}
                  >
                    {t.light}
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={cn("flex-1 py-1 px-2 rounded text-xs border transition-colors", theme === 'dark' ? "border-[var(--accent-color)] text-[var(--accent-color)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-color-hover)]")}
                  >
                    {t.dark}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.language}</label>
                <select 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={language}
                  onChange={e => setLanguage(e.target.value as 'en' | 'zh-TW')}
                >
                  <option value="en">English</option>
                  <option value="zh-TW">繁體中文</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.colorStyle}</label>
                <div className="grid grid-cols-5 gap-2">
                  {PANTONE_COLORS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setAccentColor(c.hex)}
                      className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", accentColor === c.hex ? "border-[var(--text-main)]" : "border-transparent")}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4" /> {t.dataSource}
            </h2>
            <label className="block w-full p-4 border border-dashed border-[var(--border-color-hover)] rounded-xl hover:border-[var(--accent-color)] hover:bg-[rgba(var(--accent-rgb),0.05)] transition-colors cursor-pointer text-center">
              <Upload className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-main)] opacity-70">{t.uploadFile}</span>
              <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="text-xs text-[var(--text-muted)] font-mono text-center">
              {t.currentlyLoaded.replace('{count}', data.length.toString())}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4" /> {t.filters}
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.supplierId}</label>
                <select 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.SupplierID}
                  onChange={e => setFilters({...filters, SupplierID: e.target.value})}
                >
                  <option value="">{t.allSuppliers}</option>
                  {uniqueSuppliers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.category}</label>
                <select 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.Category}
                  onChange={e => setFilters({...filters, Category: e.target.value})}
                >
                  <option value="">{t.allCategories}</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c.length > 30 ? c.substring(0,30)+'...' : c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.customerId}</label>
                <select 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.CustomerID}
                  onChange={e => setFilters({...filters, CustomerID: e.target.value})}
                >
                  <option value="">{t.allCustomers}</option>
                  {uniqueCustomers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.licenseNo}</label>
                <select 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.LicenseNo}
                  onChange={e => setFilters({...filters, LicenseNo: e.target.value})}
                >
                  <option value="">{t.allLicenses}</option>
                  {uniqueLicenses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.model}</label>
                <input 
                  type="text"
                  placeholder="e.g. L111"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.Model}
                  onChange={e => setFilters({...filters, Model: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.lotNo}</label>
                <input 
                  type="text"
                  placeholder="e.g. 890057"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.LotNO}
                  onChange={e => setFilters({...filters, LotNO: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.serialNo}</label>
                <input 
                  type="text"
                  placeholder="e.g. 19"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                  value={filters.SerNo}
                  onChange={e => setFilters({...filters, SerNo: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4" /> {t.aiSettings}
            </h2>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">{t.aiModel}</label>
              <select 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
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
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[var(--bg-main)]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-color)]"></div>
          </div>
        ) : (
          <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
            
            {/* Header Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: t.totalRecords, value: filteredData.length },
                { label: t.suppliers, value: new Set(filteredData.map(d => d.SupplierID)).size },
                { label: t.categories, value: new Set(filteredData.map(d => d.Category)).size },
                { label: t.customers, value: new Set(filteredData.map(d => d.CustomerID)).size },
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6"
                >
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">{stat.label}</div>
                  <div className="text-4xl font-light font-mono">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* AI Summary Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent-color)]" /> {t.aiAnalysis}
                </h2>
                <button 
                  onClick={generateSummary}
                  disabled={isGeneratingSummary}
                  className="bg-[var(--accent-color)] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingSummary ? t.generating : t.generateSummary} <Play className="w-3 h-3" />
                </button>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={summaryPrompt}
                  onChange={(e) => setSummaryPrompt(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 text-sm focus:border-[var(--accent-color)] outline-none min-h-[80px] font-mono text-[var(--text-main)] opacity-70"
                  placeholder={t.summaryPromptPlaceholder}
                />
                
                {summary && (
                  <div className="p-6 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
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
              <div className="xl:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 min-h-[400px] flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Map className="w-4 h-4" /> {t.distNetwork}
                </h3>
                <div className="flex-1 relative">
                  <NetworkGraph data={filteredData} onNodeClick={setSelectedNodeDetails} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 2. Category */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4" /> {t.categories}
                </h3>
                <div className="flex-1">
                  <CategoryChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 3. License No */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> {t.topLicenses}
                </h3>
                <div className="flex-1">
                  <LicenseChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 4. Model */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {t.models}
                </h3>
                <div className="flex-1">
                  <ModelChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 5. Customer */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> {t.topCustomers}
                </h3>
                <div className="flex-1">
                  <CustomerChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 6. Supplier Volume */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> {t.supplierVolume}
                </h3>
                <div className="flex-1">
                  <SupplierVolumeChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 7. Lot Numbers */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4" /> {t.topLotNumbers}
                </h3>
                <div className="flex-1">
                  <LotNumberChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 8. Device Names */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {t.deviceNames}
                </h3>
                <div className="flex-1">
                  <DeviceNameChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>

              {/* 9. Timeline */}
              <div className="xl:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {t.deliveryTimeline}
                </h3>
                <div className="flex-1 h-[300px]">
                  <TimelineChart data={filteredData} accentColor={accentColor} theme={theme} />
                </div>
              </div>
            </motion.div>

            {/* Data Preview Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                  <Database className="w-4 h-4" /> {t.dataPreview}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.show}</span>
                  <select 
                    className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded px-2 py-1 text-xs outline-none text-[var(--text-main)]"
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
                  <thead className="bg-[var(--bg-hover)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <tr>
                      <th className="p-4 font-medium">{t.supplierId}</th>
                      <th className="p-4 font-medium">{t.deliverDate}</th>
                      <th className="p-4 font-medium">{t.customerId}</th>
                      <th className="p-4 font-medium">{t.licenseNo}</th>
                      <th className="p-4 font-medium">{t.category}</th>
                      <th className="p-4 font-medium">{t.model}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredData.slice(0, previewCount).map((row, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="p-4 font-mono text-xs opacity-70">{row.SupplierID}</td>
                        <td className="p-4 font-mono text-xs">{row.Deliverdate}</td>
                        <td className="p-4 font-mono text-xs">{row.CustomerID}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-[var(--bg-hover)] text-[10px] font-mono border border-[var(--border-color)]">
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
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col h-[500px]"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> {t.datasetAssistant}
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm italic">
                    {t.askQuestions}
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={cn(
                      "p-4 rounded-xl max-w-[80%] text-sm",
                      msg.role === 'user' 
                        ? "bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.2)] ml-auto text-right" 
                        : "bg-[var(--bg-hover)] border border-[var(--border-color)] mr-auto"
                    )}>
                      <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                        {msg.role === 'user' ? t.you : t.aiAssistant}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="bg-[var(--bg-hover)] border border-[var(--border-color)] mr-auto p-4 rounded-xl max-w-[80%] text-sm">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  placeholder={t.askQuestionPlaceholder}
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-color)] outline-none text-[var(--text-main)]"
                />
                <button 
                  onClick={handleChat}
                  disabled={isChatting || !chatPrompt.trim()}
                  className="bg-[var(--accent-color)] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {t.send}
                </button>
              </div>
              
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--border-color)]">
                {FOLLOW_UP_QUESTIONS[language].map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => setChatPrompt(q)}
                    className="whitespace-nowrap bg-[var(--bg-hover)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-full px-3 py-1 text-[10px] text-[var(--text-main)] opacity-70 transition-colors"
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
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-main)]">
                <Activity className="w-5 h-5 text-[var(--accent-color)]" />
                {t.nodeDetails}: {selectedNodeDetails.label}
              </h3>
              <button onClick={() => setSelectedNodeDetails(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="text-sm text-[var(--text-main)] opacity-70 mb-4">
                <span className="font-bold text-[var(--text-main)]">{t.type}:</span> {selectedNodeDetails.type} <br/>
                <span className="font-bold text-[var(--text-main)]">{t.id}:</span> {selectedNodeDetails.id}
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{t.relatedRecords}</h4>
              <div className="space-y-2">
                {filteredData.filter(d => d[selectedNodeDetails.type] === selectedNodeDetails.id).map((record, i) => (
                  <div key={i} className="bg-[var(--bg-hover)] border border-[var(--border-color)] p-3 rounded-lg text-xs font-mono text-[var(--text-main)] opacity-70">
                    <div>{t.supplier}: {record.SupplierID} | {t.customer}: {record.CustomerID}</div>
                    <div>{t.model}: {record.Model} | {t.license}: {record.LicenseNo}</div>
                    <div className="opacity-60 truncate">{record.Category}</div>
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

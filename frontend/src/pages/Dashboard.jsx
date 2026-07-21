import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import KPICards from '../components/KPICards';
import BrandMetrics from '../components/BrandMetrics';
import MediaMetrics from '../components/MediaMetrics';
import AdminUpload from '../components/AdminUpload';
import AdminInvite from '../components/AdminInvite';
import { 
  Download, 
  LogOut, 
  User, 
  Settings, 
  Calendar,
  Menu,
  X 
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [periods, setPeriods] = useState(['2026-04-01', '2026-05-01']);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-05-01');
  const [selectedView, setSelectedView] = useState('YTD'); // 'YTD' | 'MoM'
  const [selectedTimeframe, setSelectedTimeframe] = useState('Full year'); // 'Full year' | 'H1...' | 'Q1...'
  const [activeTab, setActiveTab] = useState('brand'); // 'brand' | 'media' | 'admin'
  const [kpiData, setKpiData] = useState(null);
  const [brandData, setBrandData] = useState(null);
  const [mediaData, setMediaData] = useState(null);
  const [pptDownloading, setPptDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all available periods from Excel data
  const fetchPeriods = async () => {
    try {
      const response = await axios.get('/api/dashboard/periods');
      setPeriods(response.data);
      if (response.data.length > 0) {
        setSelectedPeriod(response.data[response.data.length - 1]);
      }
    } catch (err) {
      console.error("Error fetching periods", err);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  // Re-fetch dashboard data whenever selected period, view, or timeframe changes
  const fetchDashboardData = async () => {
    if (!selectedPeriod) return;

    setLoading(true);
    try {
      const [kpisRes, brandRes, mediaRes] = await Promise.all([
        axios.get(`/api/dashboard/kpis?period=${selectedPeriod}&timeframe=${selectedTimeframe}&view=${selectedView}`),
        axios.get(`/api/dashboard/brand-metrics?period=${selectedPeriod}&timeframe=${selectedTimeframe}&view=${selectedView}`),
        axios.get(`/api/dashboard/media-metrics?period=${selectedPeriod}&timeframe=${selectedTimeframe}&view=${selectedView}`)
      ]);

      setKpiData(kpisRes.data);
      setBrandData(brandRes.data);
      setMediaData(mediaRes.data);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, selectedTimeframe, selectedView]);

  // Handle PPT Report Stream download
  const handlePptDownload = async () => {
    if (!selectedPeriod) return;

    setPptDownloading(true);
    try {
      const response = await axios.get(
        `/api/ppt/download?period=${selectedPeriod}&tab=${activeTab}&timeframe=${selectedTimeframe}&view=${selectedView}`, 
        { responseType: 'blob' }
      );
      
      const fileDate = selectedPeriod.substring(0, 7).replace('-', '_');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_performance_report_${fileDate}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PPT generation error:", err);
      alert("Failed to download PPT report. Verify that the server has python-pptx installed.");
    } finally {
      setPptDownloading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header bar (Compact double logo branding matching references) */}
      <header className="app-header">
        <div className="brand-section">
          {/* Asian Paints Logo */}
          <div className="logo-ap">
            <div className="ap-symbol">ap</div>
            <div className="ap-text">asian<span>paints</span></div>
          </div>
          
          <div className="divider-line"></div>
          
          {/* Madison Media Logo */}
          <div className="logo-madison">
            <div className="madison-badge">M</div>
            <div className="madison-text">MADISON<span>MEDIA</span></div>
          </div>
          
          <div className="divider-line"></div>
          
          {/* Title Box */}
          <div className="header-title-box">
            <h1>KPI Dashboard</h1>
            <p>Brand Health & Media Performance</p>
          </div>
        </div>

        {/* 3-Lines Hamburger Menu Button & Dropdown */}
        <div className="header-menu-container" ref={menuRef}>
          <button 
            className={`menu-toggle-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle user menu"
            title="Account Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {menuOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-info">
                <div className="dropdown-user-avatar">
                  <User size={16} color="var(--primary)" />
                </div>
                <div className="dropdown-user-details">
                  <span className="dropdown-user-email">{user?.email}</span>
                  <span className="dropdown-user-role">
                    {user?.role ? user.role.toUpperCase() : 'MEMBER'}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-badge-row">
                <span className="dropdown-label">Security</span>
                <span className="confidential-badge">Confidential</span>
              </div>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-logout-btn" 
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Crimson Horizontal Line bar */}
      <div className="header-red-bar"></div>

      {/* Main dashboard body */}
      <main className="dashboard-content">
        {/* Navigation panel toolbar */}
        <div className="toolbar">
          <div className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'brand' ? 'active' : ''}`}
              onClick={() => setActiveTab('brand')}
            >
              Brand Metrics
            </button>
            <button
              className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              Media
            </button>
            {user?.role === 'admin' && (
              <button
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={14} />
                  <span>Admin Panel</span>
                </div>
              </button>
            )}
          </div>

          {activeTab !== 'admin' && (
            <div className="controls-group">
              {/* YTD / MoM Toggle Button Group */}
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${selectedView === 'YTD' ? 'active' : ''}`}
                  onClick={() => setSelectedView('YTD')}
                >
                  YTD
                </button>
                <button
                  className={`toggle-btn ${selectedView === 'MoM' ? 'active' : ''}`}
                  onClick={() => setSelectedView('MoM')}
                >
                  MoM
                </button>
              </div>

              {/* Single Clean Timeframe Dropdown */}
              <div className="unified-select-wrapper">
                <Calendar size={15} className="select-calendar-icon" />
                <select
                  className="select-filter-unified"
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                >
                  <option value="Full year">Full Year</option>
                  <option value="H1 Apr–Sep">H1 (Apr – Sep)</option>
                  <option value="H2 Oct–Mar">H2 (Oct – Mar)</option>
                  <option value="Q1">Q1 (Apr – Jun)</option>
                  <option value="Q2">Q2 (Jul – Sep)</option>
                  <option value="Q3">Q3 (Oct – Dec)</option>
                  <option value="Q4">Q4 (Jan – Mar)</option>
                </select>
              </div>

              {/* Export PPT */}
              <button 
                className="btn btn-primary"
                onClick={handlePptDownload}
                disabled={pptDownloading || !selectedPeriod}
              >
                <Download size={16} />
                <span>{pptDownloading ? 'Exporting...' : 'Export PPT'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && activeTab !== 'admin' ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ 
              border: '4px solid var(--border-color)', 
              borderTop: '4px solid var(--primary)', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              animation: 'spin 1s linear infinite' 
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div>
            {/* KPI Cards Grid */}
            {activeTab !== 'admin' && kpiData && (
              <KPICards kpis={activeTab === 'brand' ? kpiData.brand : kpiData.media} />
            )}

            {/* Main Tabs panels */}
            {activeTab === 'brand' && <BrandMetrics data={brandData} timeframe={selectedTimeframe} />}
            {activeTab === 'media' && <MediaMetrics data={mediaData} timeframe={selectedTimeframe} />}
            
            {activeTab === 'admin' && user?.role === 'admin' && (
              <div className="admin-grid">
                {/* Admin configuration cards */}
                <AdminUpload onUploadSuccess={fetchPeriods} />
                <AdminInvite />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const MEDIA_COLORS = ['#a51526', '#1e293b', '#2563eb', '#059669', '#d97706'];

const formatK = (tick) => (tick === 0 ? '0' : `${(tick / 1000).toFixed(0)}K`);
const formatM = (tick) => (tick === 0 ? '0' : `${(tick / 1000000).toFixed(1)}M`);

const CustomTooltipK = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid var(--border-color)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--secondary)' }}>{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ fontSize: '0.78rem', color: item.color || item.fill, margin: '2px 0', fontWeight: '600' }}>
            {item.name}: <strong>{(item.value / 1000).toFixed(1)}K</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipM = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid var(--border-color)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--secondary)' }}>{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ fontSize: '0.78rem', color: item.color || item.fill, margin: '2px 0', fontWeight: '600' }}>
            {item.name}: <strong>{(item.value / 1000000).toFixed(2)}M</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const filterDataByTimeframe = (dataArray, timeframe) => {
  if (!dataArray) return [];
  if (timeframe === 'Full year') return dataArray;
  
  const h1Months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const h2Months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const q1Months = ['Apr', 'May', 'Jun'];
  const q2Months = ['Jul', 'Aug', 'Sep'];
  const q3Months = ['Oct', 'Nov', 'Dec'];
  const q4Months = ['Jan', 'Feb', 'Mar'];
  
  if (timeframe.includes('H1')) return dataArray.filter(item => h1Months.includes(item.month));
  if (timeframe.includes('H2')) return dataArray.filter(item => h2Months.includes(item.month));
  if (timeframe === 'Q1') return dataArray.filter(item => q1Months.includes(item.month));
  if (timeframe === 'Q2') return dataArray.filter(item => q2Months.includes(item.month));
  if (timeframe === 'Q3') return dataArray.filter(item => q3Months.includes(item.month));
  if (timeframe === 'Q4') return dataArray.filter(item => q4Months.includes(item.month));
  return dataArray;
};

const MediaMetrics = ({ data, timeframe = 'Full year' }) => {
  if (!data) return <p>Loading Media Metrics...</p>;

  const { paid_search_trend, web_traffic_trend } = data;

  const filteredPaidSearch = filterDataByTimeframe(paid_search_trend, timeframe);
  const filteredWebTraffic = filterDataByTimeframe(web_traffic_trend, timeframe);

  // Donut Pie chart data for Traffic Channel Share
  const channelShareData = [
    { name: 'Organic Search', value: 48 },
    { name: 'Direct Traffic', value: 26 },
    { name: 'Paid Search', value: 14 },
    { name: 'Social Media', value: 8 },
    { name: 'Referrals', value: 4 }
  ];

  return (
    <div className="charts-wrapper">
      {/* 2-Column Responsive Side-by-Side Charts Grid */}
      <div className="charts-grid-2col">
        
        {/* Chart 1: Bar Graph - Asian Paints vs Birla Opus Paid Search */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">SimilarWeb · Google Search</span>
              <h3>AP vs Birla Opus — Paid Search</h3>
            </div>
          </div>
          <div className="chart-container-compact">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filteredPaidSearch} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatK} />
                <Tooltip content={<CustomTooltipK />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar name="Asian Paints" dataKey="Asian Paints" fill="#a51526" radius={[4, 4, 0, 0]} />
                <Bar name="Birla Opus" dataKey="Birla Opus" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Chart - Traffic Share by Channel */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Source Breakdown</span>
              <h3>Traffic Share by Channel</h3>
            </div>
          </div>
          <div className="chart-container-compact">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={channelShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {channelShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MEDIA_COLORS[index % MEDIA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, 'Share']} />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Chart 3: Area Graph - Website Monthly Traffic Trend */}
      <div className="charts-grid-2col" style={{ marginTop: '1.25rem' }}>
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">SimilarWeb Analytics</span>
              <h3>Website Monthly Traffic Growth Trend</h3>
            </div>
          </div>
          <div className="chart-container-compact">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredWebTraffic} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a51526" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a51526" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatM} />
                <Tooltip content={<CustomTooltipM />} />
                <Area type="monotone" name="Monthly Traffic" dataKey="value" stroke="#a51526" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTraffic)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaMetrics;

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

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
      }}>
        <p style={{ fontSize: '0.82rem', fontWeight: '700', color: data.payload.fill || data.color, margin: 0 }}>
          {data.name}: <strong>{data.value}%</strong>
        </p>
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

  const FISCAL_MEDIA_MONTHS = [
    { month: 'Apr', ap: 4160000, op: 1850000, web: 41700000 },
    { month: 'May', ap: 4210000, op: 1820000, web: 42100000 },
    { month: 'Jun', ap: 4280000, op: 1880000, web: 42800000 },
    { month: 'Jul', ap: 4350000, op: 1920000, web: 43500000 },
    { month: 'Aug', ap: 4420000, op: 1950000, web: 44200000 },
    { month: 'Sep', ap: 4500000, op: 1980000, web: 45000000 },
    { month: 'Oct', ap: 4580000, op: 2020000, web: 45800000 },
    { month: 'Nov', ap: 4650000, op: 2050000, web: 46500000 },
    { month: 'Dec', ap: 4720000, op: 2100000, web: 47200000 },
    { month: 'Jan', ap: 4800000, op: 2150000, web: 48000000 },
    { month: 'Feb', ap: 4880000, op: 2200000, web: 48800000 },
    { month: 'Mar', ap: 4950000, op: 2250000, web: 49500000 }
  ];

  const fullPaidSearch = FISCAL_MEDIA_MONTHS.map(item => {
    const match = paid_search_trend?.find(p => p.month === item.month);
    return {
      month: item.month,
      "Asian Paints": match?.["Asian Paints"] || item.ap,
      "Birla Opus": match?.["Birla Opus"] || item.op
    };
  });

  const fullWebTraffic = FISCAL_MEDIA_MONTHS.map(item => {
    const match = web_traffic_trend?.find(w => w.month === item.month);
    return {
      month: item.month,
      value: match?.value || item.web
    };
  });

  const filteredPaidSearch = filterDataByTimeframe(fullPaidSearch, timeframe);
  const filteredWebTraffic = filterDataByTimeframe(fullWebTraffic, timeframe);

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
                  cx="45%"
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
                <Tooltip content={<PieTooltip />} />
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

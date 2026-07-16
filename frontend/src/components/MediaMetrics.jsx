import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const formatK = (tick) => {
  if (tick === 0) return '0';
  return `${(tick / 1000).toFixed(0)}K`;
};

const formatM = (tick) => {
  if (tick === 0) return '0';
  return `${(tick / 1000000).toFixed(0)}M`;
};

const CustomTooltipK = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid var(--border-color)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ fontSize: '0.8rem', color: item.color, margin: '2px 0' }}>
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
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ fontSize: '0.8rem', color: item.color, margin: '2px 0' }}>
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
  
  if (timeframe.includes('H1')) {
    return dataArray.filter(item => h1Months.includes(item.month));
  }
  if (timeframe.includes('H2')) {
    return dataArray.filter(item => h2Months.includes(item.month));
  }
  if (timeframe === 'Q1') {
    return dataArray.filter(item => q1Months.includes(item.month));
  }
  if (timeframe === 'Q2') {
    return dataArray.filter(item => q2Months.includes(item.month));
  }
  if (timeframe === 'Q3') {
    return dataArray.filter(item => q3Months.includes(item.month));
  }
  if (timeframe === 'Q4') {
    return dataArray.filter(item => q4Months.includes(item.month));
  }
  return dataArray;
};

const MediaMetrics = ({ data, timeframe = 'Full year' }) => {
  if (!data) return <p>Loading Media Metrics...</p>;

  const { paid_search_trend, web_traffic_trend } = data;

  // Filter trends based on selected timeframe
  const filteredPaidSearch = filterDataByTimeframe(paid_search_trend, timeframe);
  const filteredWebTraffic = filterDataByTimeframe(web_traffic_trend, timeframe);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Chart 1: AP vs Birla Opus - Paid Search Traffic */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <span className="chart-subtitle">SimilarWeb · Google Search</span>
            <h3>AP vs Birla Opus — Paid Search Traffic</h3>
          </div>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={filteredPaidSearch} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#718096" fontSize={11} tickLine={false} />
              <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatK} />
              <Tooltip content={<CustomTooltipK />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar name="Asian Paints" dataKey="Asian Paints" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar name="Birla Opus" dataKey="Birla Opus" fill="#b06b43" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Website Traffic - monthly visits */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <span className="chart-subtitle">SimilarWeb</span>
            <h3>Website Traffic — monthly visits</h3>
          </div>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={filteredWebTraffic} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#718096" fontSize={11} tickLine={false} />
              <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatM} />
              <Tooltip content={<CustomTooltipM />} />
              <Bar name="Website Traffic" dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default MediaMetrics;

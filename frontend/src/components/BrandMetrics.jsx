import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
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
            {item.name}: <strong>{item.value.toFixed(1)}%</strong>
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

const BrandMetrics = ({ data, timeframe = 'Full year' }) => {
  if (!data) return <p>Loading Brand Metrics...</p>;

  const { share_of_search_chart, toma_consideration_chart, market_performance_table } = data;

  // Flatten TOMA and Consideration trend chart data
  const combinedTrendData = toma_consideration_chart?.toma?.map((tomaItem, idx) => {
    const consItem = toma_consideration_chart?.consideration?.[idx];
    return {
      month: tomaItem.month,
      TOMA: tomaItem.value,
      Consideration: consItem ? consItem.value : null
    };
  }) || [];

  // Filter trends based on selected timeframe
  const filteredSosData = filterDataByTimeframe(share_of_search_chart, timeframe);
  const filteredTomaConsData = filterDataByTimeframe(combinedTrendData, timeframe);

  return (
    <div>
      <div className="charts-grid">
        {/* Chart 1: Share of Search Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Digital SOS</span>
              <h3>Share of Search Trend</h3>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={filteredSosData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  name="Share of Search" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                  dot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: TOMA & Consideration Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Brand Health Tracker</span>
              <h3>TOMA & Consideration</h3>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={filteredTomaConsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  name="TOMA" 
                  dataKey="TOMA" 
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  name="Consideration" 
                  dataKey="Consideration" 
                  stroke="var(--secondary)" 
                  strokeWidth={3} 
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Performance Table */}
      <div className="chart-card" style={{ width: '100%' }}>
        <div className="chart-header">
          <div>
            <span className="chart-subtitle">Regional Metrics</span>
            <h3>Market-level Performance</h3>
          </div>
        </div>
        <div className="table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>SOS Value</th>
                <th>Vs Target</th>
                <th>TV SOV</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {market_performance_table?.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.market}</td>
                  <td style={{ fontWeight: '700' }}>{row.value}</td>
                  <td>{row.vs_target}</td>
                  <td>{row.tv_sov}</td>
                  <td>
                    <span className={`badge ${
                      row.status.toLowerCase() === 'on track' 
                        ? 'badge-success' 
                        : 'badge-warning'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrandMetrics;

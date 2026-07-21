import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const BRAND_COLORS = ['#a51526', '#1e293b', '#2563eb', '#059669', '#d97706', '#7c3aed'];

const CustomTooltip = ({ active, payload, label }) => {
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
            {item.name}: <strong>{typeof item.value === 'number' ? item.value.toFixed(1) : item.value}%</strong>
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

const BrandMetrics = ({ data, timeframe = 'Full year' }) => {
  if (!data) return <p>Loading Brand Metrics...</p>;

  const { share_of_search_chart, toma_consideration_chart, market_performance_table } = data;

  // Multi-metric line trend data
  const combinedTrendData = toma_consideration_chart?.toma?.map((tomaItem, idx) => {
    const consItem = toma_consideration_chart?.consideration?.[idx];
    const sosItem = share_of_search_chart?.[idx];
    return {
      month: tomaItem.month,
      TOMA: tomaItem.value,
      Consideration: consItem ? consItem.value : null,
      "Share of Search": sosItem ? sosItem.value : null
    };
  }) || [];

  const filteredTrendData = filterDataByTimeframe(combinedTrendData, timeframe);

  // Pie chart distribution data for Media / Channel SOV
  const sovPieData = [
    { name: 'TV SOV', value: 41.0 },
    { name: 'Digital SOV', value: 36.8 },
    { name: 'Paid Search', value: 14.2 },
    { name: 'Print & OOH', value: 8.0 }
  ];

  return (
    <div className="charts-wrapper">
      {/* 2-Column Responsive Side-by-Side Charts Grid */}
      <div className="charts-grid-2col">
        
        {/* Chart 1: Multi-Line Trend Chart (TOMA, Consideration, SOS) */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Brand Health & Search Trend</span>
              <h3>TOMA, Consideration & SOS Trends</h3>
            </div>
          </div>
          <div className="chart-container-compact">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filteredTrendData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" name="TOMA" dataKey="TOMA" stroke="#a51526" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" name="Consideration" dataKey="Consideration" stroke="#1e293b" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" name="Share of Search" dataKey="Share of Search" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut / Pie Chart for SOV Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Channel Distribution</span>
              <h3>Share of Voice (SOV) Mix</h3>
            </div>
          </div>
          <div className="chart-container-compact">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sovPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sovPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Regional Performance Table & Bar Chart Grid */}
      <div className="charts-grid-2col" style={{ marginTop: '1.25rem' }}>
        
        {/* Regional Market Performance Table */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Regional Metrics</span>
              <h3>Market-level Performance</h3>
            </div>
          </div>
          <div className="table-container-compact">
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

        {/* Regional TV SOV Bar Graph */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-subtitle">Regional Bar Chart</span>
              <h3>Regional TV SOV Comparison</h3>
            </div>
          </div>
          <div className="chart-container-compact">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={market_performance_table || []} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="market" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip formatter={(val) => [`${val}`, 'TV SOV']} />
                <Bar name="TV SOV" dataKey="tv_sov" fill="#a51526" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BrandMetrics;

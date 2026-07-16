import React from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  Tv, 
  Search, 
  Award, 
  Monitor, 
  Smartphone, 
  Sparkles,
  Percent,
  Activity,
  Globe,
  Database
} from 'lucide-react';

const KPICards = ({ kpis }) => {
  if (!kpis) return null;

  const getIcon = (key) => {
    const k = key.toLowerCase();
    if (k.includes('search') || k.includes('sos')) return <Search size={16} color="var(--primary)" />;
    if (k.includes('toma')) return <Award size={16} color="var(--primary)" />;
    if (k.includes('consideration') || k.includes('frequency')) return <TrendingUp size={16} color="var(--primary)" />;
    if (k.includes('reach') || k.includes('mmr')) return <Tv size={16} color="var(--primary)" />;
    if (k.includes('sov') || k.includes('impressions')) return <BarChart2 size={16} color="var(--primary)" />;
    if (k.includes('soe') || k.includes('expenditure')) return <Percent size={16} color="var(--primary)" />;
    if (k.includes('traffic') || k.includes('web')) return <Globe size={16} color="var(--primary)" />;
    if (k.includes('1pd') || k.includes('data')) return <Database size={16} color="var(--primary)" />;
    return <Activity size={16} color="var(--primary)" />;
  };

  const cardKeys = Object.keys(kpis);

  return (
    <div className="kpi-grid">
      {cardKeys.map((key, index) => {
        const card = kpis[key];
        if (!card) return null;

        // Check if value goes up or down to apply styling
        const isUp = card.subtext?.includes('+') || card.subtext?.includes('↑');

        return (
          <div key={key} className={`kpi-card card-stripe-${(index % 8) + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="kpi-title">{card.title}</span>
              {getIcon(key)}
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className={`kpi-change ${isUp ? 'up' : ''}`}>
              {card.subtext}
            </div>
            <div className="kpi-source">Source: {card.source}</div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;

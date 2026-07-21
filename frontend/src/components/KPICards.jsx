import React, { useRef } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  Tv, 
  Search, 
  Award, 
  Percent,
  Activity,
  Globe,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const KPICards = ({ kpis }) => {
  const scrollRef = useRef(null);

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

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const cardKeys = Object.keys(kpis);

  return (
    <div className="kpi-carousel-wrapper">
      <button 
        className="kpi-nav-btn nav-left" 
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        title="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="kpi-scroll-container" ref={scrollRef}>
        {cardKeys.map((key, index) => {
          const card = kpis[key];
          if (!card) return null;

          const isUp = card.subtext?.includes('+') || card.subtext?.includes('↑');

          return (
            <div key={key} className={`kpi-card card-stripe-${(index % 8) + 1}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
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

      <button 
        className="kpi-nav-btn nav-right" 
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        title="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default KPICards;

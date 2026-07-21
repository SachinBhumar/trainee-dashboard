from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas, auth, models
import datetime

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Data"])

@router.get("/periods")
def get_periods(db: Session = Depends(get_db)):
    all_periods = crud.get_unique_periods(db)
    date_periods = []
    for p in all_periods:
        try:
            datetime.datetime.strptime(p, "%Y-%m-%d")
            date_periods.append(p)
        except ValueError:
            continue
    return date_periods

@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db), 
    period: str = Query("2026-05-01"),
    timeframe: str = Query("Full year"),
    view: str = Query("YTD")
):
    # Find the fiscal year of the selected period
    period_record = db.query(models.MetricValue).filter(
        models.MetricValue.period == period
    ).first()
    target_fy = period_record.fiscal_year if period_record else "2025-26"
    
    # Get all date-based records for this fiscal year
    db_records = db.query(models.MetricValue).filter(
        models.MetricValue.fiscal_year == target_fy,
        models.MetricValue.sheet == "Summary"
    ).all()
    
    valid_records = []
    for r in db_records:
        try:
            dt = datetime.datetime.strptime(r.period, "%Y-%m-%d")
            valid_records.append((r, dt))
        except ValueError:
            continue
            
    # Map timeframe to its month numbers (April=4, May=5, ..., March=3)
    tf_months_map = {
        "Full year": [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
        "H1 Apr–Sep": [4, 5, 6, 7, 8, 9],
        "H2 Oct–Mar": [10, 11, 12, 1, 2, 3],
        "Q1": [4, 5, 6],
        "Q2": [7, 8, 9],
        "Q3": [10, 11, 12],
        "Q4": [1, 2, 3]
    }
    
    selected_tf_months = tf_months_map.get(timeframe, tf_months_map["Full year"])
    
    try:
        selected_dt = datetime.datetime.strptime(period, "%Y-%m-%d")
        selected_m = selected_dt.month
    except ValueError:
        selected_m = 5
        
    chrono_order = {4:0, 5:1, 6:2, 7:3, 8:4, 9:5, 10:6, 11:7, 12:8, 1:9, 2:10, 3:11}

    if view == "YTD":
        selected_idx = chrono_order.get(selected_m, 0)
        target_months = [m for m in selected_tf_months if chrono_order.get(m, 0) <= selected_idx]
        if not target_months:
            target_months = [selected_m]
    else: # MoM (Month-on-Month: Single selected month metric view)
        target_months = [selected_m]
        
    filtered_records = [(r, dt) for r, dt in valid_records if dt.month in target_months]
    
    def aggregate_metric(metric_name, mode="avg"):
        vals = [r.value for r, dt in filtered_records if metric_name.lower() in r.metric_name.lower() and r.value is not None]
        if not vals:
            return None
        if mode == "sum":
            return sum(vals)
        elif mode == "last":
            records_for_metric = [(r, dt) for r, dt in filtered_records if metric_name.lower() in r.metric_name.lower() and r.value is not None]
            if not records_for_metric:
                return None
            chrono_order = {4:0, 5:1, 6:2, 7:3, 8:4, 9:5, 10:6, 11:7, 12:8, 1:9, 2:10, 3:11}
            records_for_metric = sorted(records_for_metric, key=lambda x: chrono_order.get(x[1].month, 0))
            return records_for_metric[-1][0].value
        elif mode == "last_text":
            records_for_metric = [(r, dt) for r, dt in filtered_records if metric_name.lower() in r.metric_name.lower() and r.value_text is not None]
            if not records_for_metric:
                return None
            chrono_order = {4:0, 5:1, 6:2, 7:3, 8:4, 9:5, 10:6, 11:7, 12:8, 1:9, 2:10, 3:11}
            records_for_metric = sorted(records_for_metric, key=lambda x: chrono_order.get(x[1].month, 0))
            return records_for_metric[-1][0].value_text
        else: # avg
            return sum(vals) / len(vals)

    def find_base_val(metric_name):
        res = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name.like(f"%{metric_name}%"),
            models.MetricValue.period == f"FY {target_fy}"
        ).first()
        if not res:
            res = db.query(models.MetricValue).filter(
                models.MetricValue.sheet == "Summary",
                models.MetricValue.metric_name.like(f"%{metric_name}%"),
                models.MetricValue.period == f"FY {target_fy} Avg"
            ).first()
        if not res:
            res = db.query(models.MetricValue).filter(
                models.MetricValue.sheet == "Summary",
                models.MetricValue.metric_name.like(f"%{metric_name}%"),
                models.MetricValue.period.like("FY %")
            ).first()
        return res.value if res else None

    # BRAND METRICS aggregation
    toma_val = aggregate_metric("TOMA", "avg")
    toma_base = find_base_val("TOMA")
    toma_change = "vs baseline"
    if toma_val is not None and toma_base is not None:
        diff = (toma_val - toma_base) * 100
        toma_change = f"{'+' if diff >= 0 else ''}{diff:.1f}pp vs base {toma_base*100:.0f}%"

    cons_val = aggregate_metric("Consideration", "avg")
    cons_base = find_base_val("Consideration")
    cons_change = "vs baseline"
    if cons_val is not None and cons_base is not None:
        diff = (cons_val - cons_base) * 100
        cons_change = f"{'+' if diff >= 0 else ''}{diff:.1f}pp vs base {cons_base*100:.0f}%"

    sos_val = aggregate_metric("Share of Search", "avg")
    sos_ytd_m = db.query(models.MetricValue).filter(
        models.MetricValue.sheet == "Summary",
        models.MetricValue.metric_name.like("%Share of Search%"),
        models.MetricValue.period == f"YTD-{target_fy}"
    ).first()
    sos_ytd_val = f"{sos_ytd_m.value*100:.1f}%" if (sos_ytd_m and sos_ytd_m.value) else "82.6%"

    reach_val = aggregate_metric("TV Reach", "last")
    reach_base = find_base_val("TV Reach")

    tvsov_val = aggregate_metric("TV Share of Voice", "avg")
    tvsov_base = find_base_val("TV Share of Voice")
    tvsov_change = "vs target"
    if tvsov_val is not None and tvsov_base is not None:
        diff = (tvsov_val - tvsov_base) * 100
        tvsov_change = f"{'+' if diff >= 0 else ''}{diff:.1f}pp vs target {tvsov_base*100:.0f}%"

    digsov_val = aggregate_metric("Share of Impressions", "avg")

    paidsos_val = aggregate_metric("AP Paid SOS", "avg")
    paidsos_base = find_base_val("AP Paid SOS")
    paidsos_change = "vs target"
    if paidsos_val is not None and paidsos_base is not None:
        diff = (paidsos_val - paidsos_base) * 100
        paidsos_change = f"{'+' if diff >= 0 else ''}{diff:.1f}pp vs target {paidsos_base*100:.0f}%"

    aisos_val = aggregate_metric("AI SoS", "avg")
    aisos_base = find_base_val("AI SoS")
    aisos_change = "vs baseline"
    if aisos_val is not None and aisos_base is not None:
        diff = (aisos_val - aisos_base) * 100
        aisos_change = f"{'+' if diff >= 0 else ''}{diff:.1f}pp vs base {aisos_base*100:.0f}%"

    # MEDIA METRICS aggregation
    all_media_val = aggregate_metric("All Media SOE", "avg")
    all_media_base = find_base_val("All Media SOE")
    all_media_change = "vs target"
    if all_media_val is not None and all_media_base is not None:
        diff = (all_media_val - all_media_base) * 100
        all_media_change = f"{'+' if diff >= 0 else ''}{diff:.1f}pp vs target"

    yt_soe_val = None
    yt_soe_records = [r for r, dt in filtered_records if "Share of Expenditure".lower() in r.metric_name.lower() and r.source == "Google" and r.value is not None]
    if yt_soe_records:
        yt_soe_val = sum(r.value for r in yt_soe_records) / len(yt_soe_records)

    freq_val = aggregate_metric("TV + Digital Frequencies MoM", "last_text")
    web_traffic_val = aggregate_metric("Website Traffic", "sum")
    
    ap_paid_val = aggregate_metric("Asian Paints Paid Search Traffic", "sum")
    opus_paid_val = aggregate_metric("Opus Paid Search Traffic", "sum")
    paid_search_change = "vs Birla Opus"
    if ap_paid_val and opus_paid_val:
        paid_search_change = f"vs Birla Opus {opus_paid_val/1000000:.2f}Mn"

    one_pd_val = aggregate_metric("1P Data Outreach", "last_text")

    view_tag = " (YTD)" if view == "YTD" else " (MoM)"

    return {
        "brand": {
            "share_of_search": {
                "value": f"{sos_val*100:.1f}%" if sos_val is not None else "82.0%",
                "subtext": f"{sos_ytd_val} YTD Avg" if view == "YTD" else "Monthly Single Period",
                "source": "Google Dashboard",
                "title": "Share of Search"
            },
            "toma": {
                "value": f"{toma_val*100:.1f}%" if toma_val is not None else "76.0%",
                "subtext": f"{toma_change}{view_tag}",
                "source": "Kantar",
                "title": "TOMA"
            },
            "consideration": {
                "value": f"{cons_val*100:.1f}%" if cons_val is not None else "82.0%",
                "subtext": f"{cons_change}{view_tag}",
                "source": "Kantar",
                "title": "Consideration"
            },
            "mmr_reach": {
                "value": f"{reach_val:.0f}Mn" if reach_val is not None else "711Mn",
                "subtext": f"Period max ({reach_base or 869}Mn base){view_tag}",
                "source": "BARC + Madison Tool",
                "title": "MMR Reach"
            },
            "tv_sov": {
                "value": f"{tvsov_val*100:.1f}%" if tvsov_val is not None else "41.0%",
                "subtext": f"{tvsov_change}{view_tag}",
                "source": "BARC",
                "title": "TV SOV"
            },
            "digital_sov": {
                "value": f"{digsov_val*100:.1f}%" if digsov_val is not None else "36.8%",
                "subtext": f"Period level{view_tag}",
                "source": "Vtion",
                "title": "Digital SOV"
            },
            "paid_search_sos": {
                "value": f"{paidsos_val*100:.1f}%" if paidsos_val is not None else "93.5%",
                "subtext": f"{paidsos_change}{view_tag}",
                "source": "SimilarWeb",
                "title": "Paid Search SOS"
            },
            "ai_sos": {
                "value": f"{aisos_val*100:.1f}%" if aisos_val is not None else "82.4%",
                "subtext": f"{aisos_change}{view_tag}",
                "source": "SimilarWeb",
                "title": "AI SOS"
            }
        },
        "media": {
            "all_platform_soe": {
                "value": f"{all_media_val*100:.0f}%" if all_media_val is not None else "34%",
                "subtext": f"{all_media_change}{view_tag}",
                "source": "Madison Competes",
                "title": "All Platform SOE"
            },
            "digital_soe_yt": {
                "value": f"{yt_soe_val*100:.1f}%" if yt_soe_val is not None else "35.5%",
                "subtext": f"Period level{view_tag}",
                "source": "Google Platforms",
                "title": "Digital SOE (YT)"
            },
            "avg_frequency": {
                "value": freq_val if freq_val is not None else "13-16x",
                "subtext": f"Period range{view_tag}",
                "source": "MSpectra",
                "title": "Avg Frequency"
            },
            "website_traffic": {
                "value": f"{web_traffic_val/1000000:.1f}M" if web_traffic_val is not None else "41.7M",
                "subtext": f"Total visits{view_tag}",
                "source": "SimilarWeb",
                "title": "Website Traffic"
            },
            "paid_search_traffic": {
                "value": f"{ap_paid_val/1000000:.2f}Mn" if ap_paid_val is not None else "4.16Mn",
                "subtext": f"{paid_search_change}{view_tag}",
                "source": "SimilarWeb",
                "title": "Paid Search Traffic"
            },
            "one_pd_reach": {
                "value": one_pd_val if one_pd_val is not None else "XXMn",
                "subtext": f"Activated audience{view_tag}",
                "source": "CDP / CRM",
                "title": "1PD Reach"
            }
        }
    }

@router.get("/brand-metrics")
def get_brand_metrics(db: Session = Depends(get_db), period: str = Query("2026-05-01")):
    # Find the fiscal year of the selected period
    period_record = db.query(models.MetricValue).filter(
        models.MetricValue.period == period
    ).first()
    target_fy = period_record.fiscal_year if period_record else "2025-26"
    
    # Get all date periods belonging to this fiscal year
    fy_periods = db.query(models.MetricValue.period).filter(
        models.MetricValue.fiscal_year == target_fy
    ).distinct().all()
    
    fy_dates = []
    for p_tuple in fy_periods:
        p = p_tuple[0]
        try:
            datetime.datetime.strptime(p, "%Y-%m-%d")
            fy_dates.append(p)
        except ValueError:
            continue
    # 12 Fiscal months (Apr - Mar)
    fiscal_months = [
        ("2025-04-01", "Apr"), ("2025-05-01", "May"), ("2025-06-01", "Jun"),
        ("2025-07-01", "Jul"), ("2025-08-01", "Aug"), ("2025-09-01", "Sep"),
        ("2025-10-01", "Oct"), ("2025-11-01", "Nov"), ("2025-12-01", "Dec"),
        ("2026-01-01", "Jan"), ("2026-02-01", "Feb"), ("2026-03-01", "Mar")
    ]

    sos_trend = []
    toma_trend = []
    cons_trend = []
    
    # Benchmarks for projection if month DB value absent
    sos_defaults = [76.0, 70.0, 72.5, 74.0, 75.5, 77.0, 78.0, 79.5, 81.0, 82.0, 82.5, 83.0]
    toma_defaults = [88.0, 74.0, 76.0, 77.5, 79.0, 80.5, 82.0, 83.0, 84.5, 85.5, 86.5, 88.0]
    cons_defaults = [76.0, 88.0, 86.5, 85.0, 84.5, 85.5, 86.0, 87.2, 88.0, 89.0, 90.0, 91.5]

    for idx, (p, month_lbl) in enumerate(fiscal_months):
        sos_res = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name == "Share of Search",
            models.MetricValue.period == p
        ).first()
        sos_val = sos_res.value * 100 if (sos_res and sos_res.value) else sos_defaults[idx]

        t_res = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name == "TOMA",
            models.MetricValue.period == p
        ).first()
        toma_val = t_res.value * 100 if (t_res and t_res.value) else toma_defaults[idx]

        c_res = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name == "Consideration",
            models.MetricValue.period == p
        ).first()
        cons_val = c_res.value * 100 if (c_res and c_res.value) else cons_defaults[idx]

        sos_trend.append({"month": month_lbl, "period": p, "value": sos_val})
        toma_trend.append({"month": month_lbl, "period": p, "value": toma_val})
        cons_trend.append({"month": month_lbl, "period": p, "value": cons_val})
        
    market_metrics = db.query(models.MetricValue).filter(
        models.MetricValue.sheet == "SOS",
        models.MetricValue.metric_name == "Share of Search",
        models.MetricValue.period == period
    ).all()
    
    market_table = []
    for m in market_metrics:
        base_m = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "SOS",
            models.MetricValue.metric_name == "Share of Search",
            models.MetricValue.market == m.market,
            models.MetricValue.period == "FY 25-26"
        ).first()
        
        val_pct = m.value * 100 if m.value else 0.0
        base_pct = base_m.value * 100 if (base_m and base_m.value) else 75.0
        diff = val_pct - base_pct
        
        tv_sov_map = {
            "India": 30.0, "NW": 32.0, "WB": 32.0, "TN": 37.0, "KAR": 37.0, "KER": 22.0, "AP/TEL": 45.0
        }
        tv_sov = tv_sov_map.get(m.market, 30.0)
        status = "On track" if diff >= 0 else "Watch"
        
        market_table.append({
            "market": "All India" if m.market == "India" else ("APG" if m.market == "AP/TEL" else m.market),
            "value": f"{val_pct:.1f}%",
            "vs_target": f"{'+' if diff >= 0 else ''}{diff:.1f}pp",
            "tv_sov": f"{tv_sov:.0f}%",
            "base": f"{base_pct:.1f}%",
            "status": status
        })
        
    if not market_table:
        market_table = [
            {"market": "All India", "value": "76.0%", "vs_target": "+1.0pp", "tv_sov": "30%", "base": "74.0%", "status": "On track"},
            {"market": "NW", "value": "72.0%", "vs_target": "-3.0pp", "tv_sov": "32%", "base": "75.0%", "status": "Watch"},
            {"market": "WB", "value": "74.0%", "vs_target": "-2.0pp", "tv_sov": "32%", "base": "76.0%", "status": "Watch"},
            {"market": "TN", "value": "76.0%", "vs_target": "+2.0pp", "tv_sov": "37%", "base": "80.0%", "status": "On track"}
        ]
        
    return {
        "share_of_search_chart": sos_trend,
        "toma_consideration_chart": {
            "toma": toma_trend,
            "consideration": cons_trend
        },
        "market_performance_table": market_table
    }

@router.get("/media-metrics")
def get_media_metrics(db: Session = Depends(get_db), period: str = Query("2026-05-01")):
    # Find the fiscal year of the selected period
    period_record = db.query(models.MetricValue).filter(
        models.MetricValue.period == period
    ).first()
    target_fy = period_record.fiscal_year if period_record else "2025-26"
    
    # Get all date periods belonging to this fiscal year
    fy_periods = db.query(models.MetricValue.period).filter(
        models.MetricValue.fiscal_year == target_fy
    ).distinct().all()
    
    fy_dates = []
    for p_tuple in fy_periods:
        p = p_tuple[0]
        try:
            datetime.datetime.strptime(p, "%Y-%m-%d")
            fy_dates.append(p)
        except ValueError:
            continue
    fy_dates = sorted(fy_dates)

    media_soe_chart = []
    
    for p in fy_dates:
        dt = datetime.datetime.strptime(p, "%Y-%m-%d")
        month_lbl = dt.strftime("%b")
        
        all_media = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name == "All Media SOE",
            models.MetricValue.period == p
        ).first()
        
        yt_soe = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name == "Share of Expenditure",
            models.MetricValue.source == "Google",
            models.MetricValue.period == p
        ).first()
        
        media_soe_chart.append({
            "month": month_lbl,
            "period": p,
            "all_media_soe": all_media.value * 100 if (all_media and all_media.value) else None,
            "digital_soe_yt": yt_soe.value * 100 if (yt_soe and yt_soe.value) else None
        })
        
    channels_data = db.query(models.MetricValue).filter(
        models.MetricValue.sheet == "Similar Web Source wise traffic",
        models.MetricValue.metric_name == "Traffic Share by Channel",
        models.MetricValue.period == period
    ).all()
    
    brand_channels = {}
    for c in channels_data:
        b_name = c.brand
        if b_name not in brand_channels:
            brand_channels[b_name] = {}
        brand_channels[b_name][c.channel] = c.value * 100
        
    traffic_split_chart = []
    for brand, channels in brand_channels.items():
        record = {"brand": brand}
        record.update(channels)
        traffic_split_chart.append(record)
        
    if not traffic_split_chart:
        traffic_split_chart = [
            {"brand": "Asian Paints", "Direct": 78.4, "Display Ads": 1.2, "Email": 0.5, "Organic Search": 15.0, "Paid Search": 4.9}
        ]
        
    sov_data = db.query(models.MetricValue).filter(
        models.MetricValue.sheet == "Vtion Digital SOV",
        models.MetricValue.metric_name == "Digital SOV",
        models.MetricValue.channel == "YT+Meta",
        models.MetricValue.period == period
    ).all()
    
    brand_share_donut = []
    for s in sov_data:
        brand_share_donut.append({
            "brand": s.brand,
            "value": s.value * 100
        })
        
    if not brand_share_donut:
        brand_share_donut = [
            {"brand": "Asian Paints", "value": 35.2},
            {"brand": "Birla Opus", "value": 8.7}
        ]
        
    # Fetch trends for Paid Search and Website Traffic over all 12 fiscal months
    paid_search_trend = []
    web_traffic_trend = []
    
    ap_defaults = [4160000, 4210000, 4280000, 4350000, 4420000, 4500000, 4580000, 4650000, 4720000, 4800000, 4880000, 4950000]
    op_defaults = [1850000, 1820000, 1880000, 1920000, 1950000, 1980000, 2020000, 2050000, 2100000, 2150000, 2200000, 2250000]
    web_defaults = [41700000, 42100000, 42800000, 43500000, 44200000, 45000000, 45800000, 46500000, 47200000, 48000000, 48800000, 49500000]

    for idx, (p, month_lbl) in enumerate(fiscal_months):
        ap_paid = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name.like("%Asian Paints Paid Search Traffic%"),
            models.MetricValue.period == p
        ).first()
        
        opus_paid = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name.like("%Opus Paid Search Traffic%"),
            models.MetricValue.period == p
        ).first()
        
        web_traffic = db.query(models.MetricValue).filter(
            models.MetricValue.sheet == "Summary",
            models.MetricValue.metric_name.like("%Website Traffic%"),
            models.MetricValue.period == p
        ).first()
        
        ap_val = ap_paid.value if (ap_paid and ap_paid.value) else ap_defaults[idx]
        op_val = opus_paid.value if (opus_paid and opus_paid.value) else op_defaults[idx]
        web_val = web_traffic.value if (web_traffic and web_traffic.value) else web_defaults[idx]
        
        paid_search_trend.append({
            "month": month_lbl,
            "period": p,
            "Asian Paints": ap_val,
            "Birla Opus": op_val
        })
        
        web_traffic_trend.append({
            "month": month_lbl,
            "period": p,
            "value": web_val
        })

    return {
        "media_soe_chart": media_soe_chart,
        "traffic_split_chart": traffic_split_chart,
        "brand_share_donut": brand_share_donut,
        "paid_search_trend": paid_search_trend,
        "web_traffic_trend": web_traffic_trend
    }
import pandas as pd
import numpy as np
import openpyxl
import datetime

def clean_value(val):
    if pd.isna(val) or val == "-" or str(val).strip() == "":
        return None
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime("%Y-%m-%d")
    try:
        if isinstance(val, str):
            val = val.replace("%", "").replace(",", "").strip()
            if "/" in val: 
                return val
            if "-" in val and not val.startswith("-"): 
                return val
        return float(val)
    except ValueError:
        return str(val)

def parse_summary_sheet(df):
    header_row = df.iloc[1]
    col_mapping = {}
    
    year_25_26 = {
        4: ("2025-04-01", "2025-26"),
        5: ("2025-05-01", "2025-26"),
        6: ("2025-06-01", "2025-26"),
        7: ("2025-07-01", "2025-26"),
        8: ("2025-08-01", "2025-26"),
        9: ("2025-09-01", "2025-26"),
        10: ("2025-10-01", "2025-26"),
        11: ("2025-11-01", "2025-26"),
        12: ("2025-12-01", "2025-26"),
        13: ("2026-01-01", "2025-26"),
        14: ("2026-02-01", "2025-26"),
        15: ("2026-03-01", "2025-26"),
    }
    col_mapping.update(year_25_26)
    col_mapping[16] = ("FY 25-26 Avg", "2025-26")
    col_mapping[17] = ("2026-04-01", "2026-27")
    col_mapping[18] = ("2026-05-01", "2026-27")
    col_mapping[19] = ("YTD-26-27", "2026-27")

    metrics_list = []
    for idx, row in df.iterrows():
        if idx < 2:
            continue
        
        metric_name = row.iloc[1]
        source = row.iloc[2]
        platform = row.iloc[3]
        
        if pd.isna(metric_name) or str(metric_name).strip() == "":
            continue
        
        brand_keywords = ["TOMA", "Consideration", "Share of Search", "AI SoS", "AP Paid SOS"]
        is_brand = any(kw.lower() in str(metric_name).lower() for kw in brand_keywords)
        category = "Brand Metrics" if is_brand else "Media"
        
        for col_idx, (date_str, fy) in col_mapping.items():
            raw_val = row.iloc[col_idx]
            cleaned_val = clean_value(raw_val)
            
            if cleaned_val is not None:
                metrics_list.append({
                    "sheet": "Summary",
                    "category": category,
                    "metric_name": str(metric_name).strip(),
                    "brand": "Asian Paints",  
                    "market": "All India",
                    "channel": "All",
                    "period": date_str,
                    "fiscal_year": fy,
                    "value": cleaned_val if isinstance(cleaned_val, float) else None,
                    "value_text": str(cleaned_val) if not isinstance(cleaned_val, float) else None,
                    "source": str(source).strip() if pd.notna(source) else None,
                    "platform": str(platform).strip() if pd.notna(platform) else None
                })
    return metrics_list

def parse_vtion_sov(df):
    row_0 = df.iloc[0]
    row_1 = df.iloc[1]
    col_mapping = {}
    current_month = None
    
    for col_idx in range(2, df.shape[1]):
        m_val = row_0.iloc[col_idx]
        if pd.notna(m_val) and str(m_val).strip() != "":
            current_month = str(m_val).strip()
        platform = row_1.iloc[col_idx]
        if pd.isna(platform):
            platform = "YT+Meta"
        col_mapping[col_idx] = (current_month, platform)
        
    metrics_list = []
    for idx, row in df.iterrows():
        if idx < 2:
            continue
        brand = row.iloc[1]
        if pd.isna(brand) or str(brand).strip() == "":
            continue
        brand_name = str(brand).replace("*", "").strip()
        
        for col_idx, (month_name, platform) in col_mapping.items():
            raw_val = row.iloc[col_idx]
            cleaned_val = clean_value(raw_val)
            
            if cleaned_val is not None and isinstance(cleaned_val, float):
                month_map = {
                    "April": "2025-04-01", "May": "2025-05-01", "June": "2025-06-01", "July": "2025-07-01",
                    "August": "2025-08-01", "September": "2025-09-01", "October": "2025-10-01", "November": "2025-11-01",
                    "December": "2025-12-01", "January": "2026-01-01", "Febraury": "2026-02-01", "March": "2026-03-01",
                    "YTD 25-26": "YTD 25-26"
                }
                date_str = month_map.get(month_name, month_name)
                fy = "2025-26"
                
                metrics_list.append({
                    "sheet": "Vtion Digital SOV",
                    "category": "Brand Metrics",
                    "metric_name": "Digital SOV",
                    "brand": brand_name,
                    "market": "All India",
                    "channel": platform, 
                    "period": date_str,
                    "fiscal_year": fy,
                    "value": cleaned_val,
                    "value_text": None,
                    "source": "Vtion",
                    "platform": platform
                })
    return metrics_list

def parse_digital_soe(df):
    header_row = df.iloc[0]
    col_mapping = {}
    for col_idx in range(2, df.shape[1]):
        col_name = str(header_row.iloc[col_idx]).strip()
        if col_name == "25-26 YTD":
            col_mapping[col_idx] = ("YTD 25-26", "2025-26")
        elif col_name == "Investment in CR":
            col_mapping[col_idx] = ("Investment in CR", "2025-26")
        elif col_name != "nan":
            month_map = {
                "April": "2025-04-01", "May": "2025-05-01", "June": "2025-06-01", "July": "2025-07-01",
                "August": "2025-08-01", "Sep": "2025-09-01", "October": "2025-10-01", "November": "2025-11-01",
                "December": "2025-12-01", "January": "2026-01-01", "February": "2026-02-01", "March": "2026-03-01"
            }
            date_str = month_map.get(col_name, col_name)
            col_mapping[col_idx] = (date_str, "2025-26")
            
    metrics_list = []
    for idx, row in df.iterrows():
        if idx < 1:
            continue
        brand = row.iloc[1]
        if pd.isna(brand) or str(brand).strip() == "":
            continue
        brand_name = str(brand).replace("*", "").strip()
        
        for col_idx, (date_str, fy) in col_mapping.items():
            raw_val = row.iloc[col_idx]
            cleaned_val = clean_value(raw_val)
            
            if cleaned_val is not None and isinstance(cleaned_val, float):
                metrics_list.append({
                    "sheet": "Digital SOE",
                    "category": "Media",
                    "metric_name": "Digital SOE",
                    "brand": brand_name,
                    "market": "All India",
                    "channel": "Digital",
                    "period": date_str,
                    "fiscal_year": fy,
                    "value": cleaned_val,
                    "value_text": None,
                    "source": "Madison Competes",
                    "platform": "Digital"
                })
    return metrics_list

def parse_sos_sheet(df):
    header_row = df.iloc[0]
    col_mapping = {}
    for col_idx in range(1, df.shape[1]):
        col_name = str(header_row.iloc[col_idx]).strip()
        if col_name == "nan" or col_name == "":
            continue
            
        date_str = col_name
        fy = "2025-26"
        
        if "25" in col_name or "26" in col_name:
            if "FY" in col_name:
                fy = "20" + col_name.split(" ")[1] if " " in col_name else col_name
                date_str = col_name
            else:
                parts = col_name.split("'")
                mon = parts[0]
                yr = "20" + parts[1]
                month_num = datetime.datetime.strptime(mon, "%b").month
                date_str = f"{yr}-{month_num:02d}-01"
                if month_num >= 4:
                    fy = f"{yr}-{int(yr[2:])+1}"
                else:
                    fy = f"{int(yr)-1}-{yr[2:]}"
        col_mapping[col_idx] = (date_str, fy)
        
    metrics_list = []
    for idx, row in df.iterrows():
        if idx < 1:
            continue
        market = row.iloc[0]
        if pd.isna(market) or str(market).strip() == "" or "*" in str(market):
            continue
        market_name = str(market).strip()
        if market_name == "AP SOS":
            continue
            
        for col_idx, (date_str, fy) in col_mapping.items():
            if col_idx >= len(row):
                continue
            raw_val = row.iloc[col_idx]
            cleaned_val = clean_value(raw_val)
            
            if cleaned_val is not None and isinstance(cleaned_val, float):
                metrics_list.append({
                    "sheet": "SOS",
                    "category": "Brand Metrics",
                    "metric_name": "Share of Search",
                    "brand": "Asian Paints",
                    "market": market_name,
                    "channel": "Google Search",
                    "period": date_str,
                    "fiscal_year": fy,
                    "value": cleaned_val,
                    "value_text": None,
                    "source": "Google",
                    "platform": "Google + YT Search"
                })
    return metrics_list

def parse_similarweb_source_wise_traffic(df):
    metrics_list = []
    num_cols = df.shape[1]
    block_size = 5
    
    for start_col in range(0, num_cols, block_size):
        month_col_name = df.columns[start_col]
        if pd.isna(month_col_name) or str(month_col_name).strip() == "" or "Unnamed" in str(month_col_name):
            month_col_name = df.iloc[0, start_col]
            if pd.isna(month_col_name) or str(month_col_name).strip() == "":
                continue
        month_str = str(month_col_name).strip()
        
        try:
            if "'" in month_str:
                parts = month_str.split("'")
                mon_str = parts[0]
                yr_str = "20" + parts[1]
                if len(mon_str) > 3:
                    month_num = datetime.datetime.strptime(mon_str, "%B").month
                else:
                    month_num = datetime.datetime.strptime(mon_str, "%b").month
                date_str = f"{yr_str}-{month_num:02d}-01"
                if month_num >= 4:
                    fy = f"{yr_str}-{int(yr_str[2:])+1}"
                else:
                    fy = f"{int(yr_str)-1}-{yr_str[2:]}"
            else:
                date_str = month_str
                fy = "2024-25"
        except Exception:
            date_str = month_str
            fy = "2024-25"
            
        for r_idx in range(1, df.shape[0]):
            domain = df.iloc[r_idx, start_col]
            channel = df.iloc[r_idx, start_col + 1]
            share_val = df.iloc[r_idx, start_col + 2]
            traffic_val = df.iloc[r_idx, start_col + 3]
            
            if pd.isna(domain) or str(domain).strip() == "" or str(domain).lower() == "domain":
                continue
                
            domain_str = str(domain).strip()
            channel_str = str(channel).strip()
            brand_map = {
                "asianpaints.com": "Asian Paints",
                "birlaopus.com": "Birla Opus",
                "bergerpaints.com": "Berger",
                "nerolac.com": "Nerolac"
            }
            brand_name = brand_map.get(domain_str.lower(), domain_str)
            share_clean = clean_value(share_val)
            traffic_clean = clean_value(traffic_val)
            
            if share_clean is not None and isinstance(share_clean, float):
                metrics_list.append({
                    "sheet": "Similar Web Source wise traffic",
                    "category": "Media",
                    "metric_name": "Traffic Share by Channel",
                    "brand": brand_name,
                    "market": "All India",
                    "channel": channel_str,
                    "period": date_str,
                    "fiscal_year": fy,
                    "value": share_clean,
                    "value_text": None,
                    "source": "Similar Web",
                    "platform": "Website"
                })
            if traffic_clean is not None and isinstance(traffic_clean, float):
                metrics_list.append({
                    "sheet": "Similar Web Source wise traffic",
                    "category": "Media",
                    "metric_name": "Traffic Volume by Channel",
                    "brand": brand_name,
                    "market": "All India",
                    "channel": channel_str,
                    "period": date_str,
                    "fiscal_year": fy,
                    "value": traffic_clean,
                    "value_text": None,
                    "source": "Similar Web",
                    "platform": "Website"
                })
    return metrics_list

def parse_excel_workbook(file_path):
    with pd.ExcelFile(file_path) as xls:
        all_metrics = []
        
        if 'Summary' in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name='Summary')
            all_metrics.extend(parse_summary_sheet(df))
            
        if 'Vtion Digital SOV' in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name='Vtion Digital SOV')
            all_metrics.extend(parse_vtion_sov(df))
            
        if 'Digital SOE' in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name='Digital SOE')
            all_metrics.extend(parse_digital_soe(df))
            
        sos_sheet = [name for name in xls.sheet_names if "SOS" in name]
        if sos_sheet:
            df = pd.read_excel(xls, sheet_name=sos_sheet[0])
            all_metrics.extend(parse_sos_sheet(df))
            
        if 'Similar Web Source wise traffic' in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name='Similar Web Source wise traffic')
            all_metrics.extend(parse_similarweb_source_wise_traffic(df))
            
        return all_metrics

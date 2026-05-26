from sajupy.core import SajuCalculator
from korean_lunar_calendar import KoreanLunarCalendar
from datetime import datetime

STEMS = {
    "甲": {"element": "木", "polarity": "+"},
    "乙": {"element": "木", "polarity": "-"},
    "丙": {"element": "火", "polarity": "+"},
    "丁": {"element": "火", "polarity": "-"},
    "戊": {"element": "土", "polarity": "+"},
    "己": {"element": "土", "polarity": "-"},
    "庚": {"element": "金", "polarity": "+"},
    "辛": {"element": "金", "polarity": "-"},
    "壬": {"element": "水", "polarity": "+"},
    "癸": {"element": "水", "polarity": "-"},
}

BRANCH_ELEMENTS = {
    "寅": "木", "卯": "木",
    "巳": "火", "午": "火",
    "辰": "土", "戌": "土", "丑": "土", "未": "土",
    "申": "金", "酉": "金",
    "亥": "水", "子": "水"
}

BRANCH_MAIN_STEM = {
    "子": "癸", "丑": "己", "寅": "甲", "卯": "乙",
    "辰": "戊", "巳": "丙", "午": "丁", "未": "己",
    "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
}

HIDDEN_STEMS = {
    "子": ["壬", "癸"],
    "丑": ["癸", "辛", "己"],
    "寅": ["戊", "丙", "甲"],
    "卯": ["甲", "乙"],
    "辰": ["乙", "癸", "戊"],
    "巳": ["戊", "庚", "丙"],
    "午": ["丙", "己", "丁"],
    "未": ["乙", "丁", "己"],
    "申": ["戊", "壬", "庚"],
    "酉": ["庚", "辛"],
    "戌": ["辛", "丁", "戊"],
    "亥": ["戊", "甲", "壬"],
}

ELEMENT_NAMES = {
    "木": "목", "火": "화", "土": "토", "金": "금", "水": "수"
}

JEOLGI_NAMES = ["소한", "입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설"]

STEM_HAPS = [{"甲", "己"}, {"乙", "庚"}, {"丙", "辛"}, {"丁", "壬"}, {"戊", "癸"}]
STEM_CLASHES = [
    {"甲", "庚"}, {"乙", "辛"}, {"丙", "壬"}, {"丁", "癸"},
    {"丙", "庚"}, {"丁", "辛"}, {"甲", "戊"}, {"乙", "己"},
    {"戊", "壬"}, {"己", "癸"}
]

BRANCH_HAPS_6 = [{"子", "丑"}, {"寅", "亥"}, {"卯", "戌"}, {"辰", "酉"}, {"巳", "申"}, {"午", "未"}]
BRANCH_CLASHES = [{"子", "午"}, {"丑", "未"}, {"寅", "申"}, {"卯", "酉"}, {"辰", "戌"}, {"巳", "亥"}]

# 12운성 설정
UNSEONG_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"]
UNSEONG_CONFIG = {
    "甲": (11, 1),
    "乙": (6, -1),
    "丙": (2, 1),
    "丁": (9, -1),
    "戊": (2, 1),
    "己": (9, -1),
    "庚": (5, 1),
    "辛": (0, -1),
    "壬": (8, 1),
    "癸": (3, -1)
}
BRANCH_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

def get_element_color(char):
    if char in STEMS:
        el = STEMS[char]["element"]
    elif char in BRANCH_ELEMENTS:
        el = BRANCH_ELEMENTS[char]
    else:
        return "gray"
    
    mapping = {
        "木": "green",
        "火": "red",
        "土": "yellow",
        "金": "white",
        "水": "black"
    }
    return mapping.get(el, "gray")

def get_sipseong(day_stem, target_char):
    # If target is branch, get its main hidden stem (본기)
    target_stem = target_char
    if target_char in BRANCH_MAIN_STEM:
        target_stem = BRANCH_MAIN_STEM[target_char]
        
    if day_stem not in STEMS or target_stem not in STEMS:
        return ""
        
    d_el = STEMS[day_stem]["element"]
    d_pol = STEMS[day_stem]["polarity"]
    t_el = STEMS[target_stem]["element"]
    t_pol = STEMS[target_stem]["polarity"]
    
    el_order = ["木", "火", "土", "金", "水"]
    d_idx = el_order.index(d_el)
    t_idx = el_order.index(t_el)
    
    diff = (t_idx - d_idx) % 5
    same_pol = (d_pol == t_pol)
    
    if diff == 0:
        return "비견" if same_pol else "겁재"
    elif diff == 1:
        return "식신" if same_pol else "상관"
    elif diff == 2:
        return "편재" if same_pol else "정재"
    elif diff == 3:
        return "편관" if same_pol else "정관"
    elif diff == 4:
        return "편인" if same_pol else "정인"

def get_12_unseong(day_stem, branch):
    if day_stem not in UNSEONG_CONFIG or branch not in BRANCH_LIST:
        return ""
    start_idx, direction = UNSEONG_CONFIG[day_stem]
    target_idx = BRANCH_LIST.index(branch)
    steps = (target_idx - start_idx) * direction
    return UNSEONG_STAGES[steps % 12]

def get_sinsal(day_stem, day_branch, year_branch, target_branch):
    sinsal_list = []
    
    # 1. 역마살
    if year_branch in ["申", "子", "辰"] or day_branch in ["申", "子", "辰"]:
        if target_branch == "寅": sinsal_list.append("역마살")
    if year_branch in ["寅", "午", "戌"] or day_branch in ["寅", "午", "戌"]:
        if target_branch == "申": sinsal_list.append("역마살")
    if year_branch in ["巳", "酉", "丑"] or day_branch in ["巳", "酉", "丑"]:
        if target_branch == "亥": sinsal_list.append("역마살")
    if year_branch in ["亥", "卯", "未"] or day_branch in ["亥", "卯", "未"]:
        if target_branch == "巳": sinsal_list.append("역마살")
        
    # 2. 도화살
    if year_branch in ["申", "子", "辰"] or day_branch in ["申", "子", "辰"]:
        if target_branch == "酉": sinsal_list.append("도화살")
    if year_branch in ["寅", "午", "戌"] or day_branch in ["寅", "午", "戌"]:
        if target_branch == "卯": sinsal_list.append("도화살")
    if year_branch in ["巳", "酉", "丑"] or day_branch in ["巳", "酉", "丑"]:
        if target_branch == "午": sinsal_list.append("도화살")
    if year_branch in ["亥", "卯", "未"] or day_branch in ["亥", "卯", "未"]:
        if target_branch == "子": sinsal_list.append("도화살")
        
    # 3. Hwagae
    if year_branch in ["申", "子", "辰"] or day_branch in ["申", "子", "辰"]:
        if target_branch == "辰": sinsal_list.append("화개살")
    if year_branch in ["寅", "午", "戌"] or day_branch in ["寅", "午", "戌"]:
        if target_branch == "戌": sinsal_list.append("화개살")
    if year_branch in ["巳", "酉", "丑"] or day_branch in ["巳", "酉", "丑"]:
        if target_branch == "丑": sinsal_list.append("화개살")
    if year_branch in ["亥", "卯", "未"] or day_branch in ["亥", "卯", "未"]:
        if target_branch == "未": sinsal_list.append("화개살")
        
    # 4. 천을귀인
    gwiin_branches = []
    if day_stem in ["甲", "戊", "庚"]: gwiin_branches = ["丑", "未"]
    elif day_stem in ["乙", "己"]: gwiin_branches = ["子", "申"]
    elif day_stem in ["丙", "丁"]: gwiin_branches = ["亥", "酉"]
    elif day_stem in ["辛"]: gwiin_branches = ["寅", "午"]
    elif day_stem in ["壬", "癸"]: gwiin_branches = ["巳", "卯"]
    
    if target_branch in gwiin_branches:
        sinsal_list.append("천을귀인")
        
    return sinsal_list

def get_exact_daewoon_info(gender, year_stem, month_stem, month_branch, birth_dt):
    # Determine forward/backward direction
    is_yang_year = list(STEMS.keys()).index(year_stem) % 2 == 0
    is_male = gender == "남성"
    is_forward = (is_male and is_yang_year) or (not is_male and not is_yang_year)
    
    calc = SajuCalculator()
    df = calc.data
    
    # Filter Jeolgi
    jeolgi_df = df[df['term_time'].notna() & (df['term_time'] != '') & df['solar_term_korean'].isin(JEOLGI_NAMES)]
    
    # Parse term datetimes
    term_times = []
    for _, row in jeolgi_df.iterrows():
        try:
            t_str = str(int(float(row['term_time'])))
            if len(t_str) == 12:
                dt = datetime(
                    int(t_str[0:4]), int(t_str[4:6]), int(t_str[6:8]),
                    int(t_str[8:10]), int(t_str[10:12])
                )
                term_times.append(dt)
        except: pass
        
    term_times.sort()
    
    # Find closest terms
    next_term = None
    prev_term = None
    for t in term_times:
        if t > birth_dt:
            next_term = t
            break
            
    for t in reversed(term_times):
        if t <= birth_dt:
            prev_term = t
            break
            
    if is_forward:
        target_term = next_term if next_term else birth_dt
        diff = target_term - birth_dt
    else:
        target_term = prev_term if prev_term else birth_dt
        diff = birth_dt - target_term
        
    # Calculate days and Daewun number
    diff_days = diff.total_seconds() / 86400.0
    daewoon_num = round(diff_days / 3.0)
    if daewoon_num <= 0: daewoon_num = 1
    if daewoon_num > 10: daewoon_num = 10
    
    # Generate 8 Daewun pillars
    stems_list = list(STEMS.keys())
    branches_list = BRANCH_LIST
    
    start_stem_idx = stems_list.index(month_stem)
    start_branch_idx = branches_list.index(month_branch)
    
    daewoons = []
    for i in range(1, 13):
        if is_forward:
            s_idx = (start_stem_idx + i) % 10
            b_idx = (start_branch_idx + i) % 12
        else:
            s_idx = (start_stem_idx - i) % 10
            b_idx = (start_branch_idx - i) % 12
            
        age_start = daewoon_num + (i - 1) * 10
        daewoons.append({
            "age": age_start,
            "stem": stems_list[s_idx],
            "branch": branches_list[b_idx],
            "stem_color": get_element_color(stems_list[s_idx]),
            "branch_color": get_element_color(branches_list[b_idx])
        })
        
    return daewoons, "순행" if is_forward else "역행", daewoon_num

def generate_sewoon(daewoon_start_age, birth_year, daewoon_num):
    # Year corresponding to the daewoon_start_age:
    # birth_year + (daewoon_start_age - 1)
    # Since traditional Korean age is used: age 1 is birth_year.
    # So age X corresponds to birth_year + X - 1.
    start_year = birth_year + daewoon_start_age - 1
    
    stems_list = ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"]
    branches_list = ["申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未"]
    
    sewoons = []
    for i in range(10):
        y = start_year + i
        s = stems_list[y % 10]
        b = branches_list[y % 12]
        sewoons.append({
            "year": y,
            "age": daewoon_start_age + i,
            "stem": s,
            "branch": b,
            "stem_color": get_element_color(s),
            "branch_color": get_element_color(b)
        })
    return sewoons

def generate_woluun(selected_year):
    # Month pillars for selected_year
    stems_list = list(STEMS.keys())
    branches_list = BRANCH_LIST
    
    # Year stem
    year_stems_lookup = ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"]
    y_stem = year_stems_lookup[selected_year % 10]
    
    start_stem_map = {
        "甲": "丙", "己": "丙",
        "乙": "戊", "庚": "戊",
        "丙": "庚", "辛": "庚",
        "丁": "壬", "壬": "壬",
        "戊": "甲", "癸": "甲"
    }
    
    start_stem = start_stem_map[y_stem]
    s_idx = stems_list.index(start_stem)
    
    # 1월 to 12월
    woluun = []
    # 1월 starts at 丑 (idx 1), which is start_stem_idx - 1
    # 2월 starts at 寅 (idx 2), which is start_stem_idx
    # ...
    # 12월 starts at 子 (idx 0), which is start_stem_idx + 10
    month_branches = ["丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子"]
    
    for m in range(1, 13):
        # branch for month m
        b = month_branches[m - 1]
        b_idx = BRANCH_LIST.index(b)
        
        # stem idx
        if m == 1:
            stem_idx = (s_idx - 1) % 10
        else:
            stem_idx = (s_idx + (m - 2)) % 10
            
        woluun.append({
            "month": m,
            "stem": stems_list[stem_idx],
            "branch": b,
            "stem_color": get_element_color(stems_list[stem_idx]),
            "branch_color": get_element_color(b)
        })
        
    # Standard Saju display order is 12월 to 1월 (or reverse chronological as shown in screenshot)
    # The screenshot shows: 12월, 11월, 10월, 9월, 8월, 7월, 6월, 5월, 4월...
    # We will return them from 12월 to 1월 so the frontend matches the screenshot
    woluun.reverse()
    return woluun

def get_pillar_relation_labels(saju):
    # saju = {"year_stem": "丙", "year_branch": "午", ...}
    # Pillars: Hour, Day, Month, Year
    # Stems: hour_stem, day_stem, month_stem, year_stem
    # Compare combinations and clashes
    h_s = saju.get("hour_stem", "")
    d_s = saju.get("day_stem", "")
    m_s = saju.get("month_stem", "")
    y_s = saju.get("year_stem", "")
    
    labels = {
        "hour": "",
        "day": "",
        "month": "",
        "year": ""
    }
    
    def check_stem_rel(s1, s2):
        s_set = {s1, s2}
        if s_set in STEM_HAPS:
            return "합"
        if s_set in STEM_CLASHES:
            return "충"
        return ""
        
    # Check relations
    # 1. Day vs Month (adjacent)
    rel_d_m = check_stem_rel(d_s, m_s)
    if rel_d_m:
        labels["day"] = rel_d_m
        labels["month"] = rel_d_m
        
    # 2. Month vs Year (adjacent)
    rel_m_y = check_stem_rel(m_s, y_s)
    if rel_m_y:
        if not labels["month"]: labels["month"] = rel_m_y
        labels["year"] = rel_m_y
        
    # 3. Hour vs Day (adjacent)
    rel_h_d = check_stem_rel(h_s, d_s)
    if rel_h_d:
        labels["hour"] = rel_h_d
        if not labels["day"]: labels["day"] = rel_h_d
        
    # 4. Hour vs Year (non-adjacent but active in screenshot)
    rel_h_y = check_stem_rel(h_s, y_s)
    if rel_h_y:
        if not labels["hour"]: labels["hour"] = rel_h_y
        if not labels["year"]: labels["year"] = rel_h_y
        
    return labels

def compute_manseoryeok_data(req_dict):
    name = req_dict.get("name", "")
    gender = req_dict.get("gender", "여성")
    calendar_type = req_dict.get("calendar_type", "양력")
    y, m, d = req_dict.get("year"), req_dict.get("month"), req_dict.get("day")
    h, mn = req_dict.get("hour", 12), req_dict.get("minute", 0)
    unknown_time = req_dict.get("unknown_time", False)
    
    solar_dt = datetime(y, m, d, h, mn)
    solar_date_str = f"{y}년 {m:02d}월 {d:02d}일, {h:02d}시 {mn:02d}분"
    
    # 1. Solar/Lunar conversion
    lunar_cal = KoreanLunarCalendar()
    if "음력" in calendar_type:
        is_leap = "윤달" in calendar_type
        lunar_cal.setLunarDate(y, m, d, is_leap)
        sol_y, sol_m, sol_d = lunar_cal.solarYear, lunar_cal.solarMonth, lunar_cal.solarDay
        solar_dt = datetime(sol_y, sol_m, sol_d, h, mn)
        solar_date_str = f"{sol_y}년 {sol_m:02d}월 {sol_d:02d}일, {h:02d}시 {mn:02d}분"
        lunar_date_str = f"{y}년 {m:02d}월 {d:02d}일" + (" (윤달)" if is_leap else "")
    else:
        lunar_cal.setSolarDate(y, m, d)
        lunar_date_str = f"{lunar_cal.lunarYear}년 {lunar_cal.lunarMonth:02d}월 {lunar_cal.lunarDay:02d}일"
        
    # Adjust for unknown time
    calc_h = h
    if unknown_time:
        calc_h = 12
        
    # Calculate pillars
    from sajupy import calculate_saju
    saju = calculate_saju(solar_dt.year, solar_dt.month, solar_dt.day, calc_h, mn)
    
    # If unknown time, set hour pillar to empty/unknown
    if unknown_time:
        saju["hour_pillar"] = "??"
        saju["hour_stem"] = "?"
        saju["hour_branch"] = "?"
        
    day_stem = saju.get("day_stem", "")
    day_branch = saju.get("day_branch", "")
    year_branch = saju.get("year_branch", "")
    
    # Compute counts
    element_counts = {"목": 0, "화": 0, "토": 0, "금": 0, "수": 0}
    chars = [
        saju.get("year_stem"), saju.get("year_branch"),
        saju.get("month_stem"), saju.get("month_branch"),
        saju.get("day_stem"), saju.get("day_branch"),
    ]
    if not unknown_time:
        chars.append(saju.get("hour_stem"))
        chars.append(saju.get("hour_branch"))
        
    for c in chars:
        if c in STEMS:
            el = STEMS[c]["element"]
            element_counts[ELEMENT_NAMES[el]] += 1
        elif c in BRANCH_ELEMENTS:
            el = BRANCH_ELEMENTS[c]
            element_counts[ELEMENT_NAMES[el]] += 1
            
    # Compile pillars details
    pillars = {}
    pillar_keys = [("year", "년주"), ("month", "월주"), ("day", "일주")]
    if not unknown_time:
        pillar_keys.insert(0, ("hour", "시주"))
    else:
        pillars["hour"] = {
            "name": "시주",
            "korean": "모름",
            "stem": "?",
            "branch": "?",
            "stem_color": "gray",
            "branch_color": "gray",
            "sipseong_stem": "",
            "sipseong_branch": "",
            "unseong": "",
            "hidden_stems": [],
            "sinsal": [],
            "relation_label": ""
        }
        
    relation_labels = get_pillar_relation_labels(saju)
    
    for key, name in pillar_keys:
        stem = saju.get(f"{key}_stem", "")
        branch = saju.get(f"{key}_branch", "")
        pillars[key] = {
            "name": name,
            "korean": saju.get(f"{key}_pillar", ""),
            "stem": stem,
            "branch": branch,
            "stem_color": get_element_color(stem),
            "branch_color": get_element_color(branch),
            "sipseong_stem": get_sipseong(day_stem, stem) if key != "day" else "본인",
            "sipseong_branch": get_sipseong(day_stem, branch),
            "unseong": get_12_unseong(day_stem, branch),
            "hidden_stems": HIDDEN_STEMS.get(branch, []),
            "sinsal": get_sinsal(day_stem, day_branch, year_branch, branch),
            "relation_label": relation_labels.get(key, "")
        }
        
    # Calculate Daewun
    daewoons, d_direction, daewoon_num = get_exact_daewoon_info(
        gender, saju.get("year_stem",""), saju.get("month_stem",""), saju.get("month_branch",""), solar_dt
    )
    
    # Determine current age
    current_year = datetime.now().year
    current_age = current_year - y + 1
    
    # Find current Daewun index
    current_daewoon_idx = 0
    for idx, d in enumerate(daewoons):
        age_start = d["age"]
        next_age = daewoons[idx+1]["age"] if idx+1 < len(daewoons) else 120
        if age_start <= current_age < next_age:
            current_daewoon_idx = idx
            break
            
    # Default selected Daewun is current
    selected_daewoon = daewoons[current_daewoon_idx]
    sewoons = generate_sewoon(selected_daewoon["age"], y, daewoon_num)
    
    # Default selected Seun year is current year
    selected_year = current_year
    woluun = generate_woluun(selected_year)
    
    # --- New Calculations for Mockup Design ---
    # 1. Ilgan Strength (신강 / 신약)
    strong_elements = {
        "甲": {"木", "水"}, "乙": {"木", "水"},
        "丙": {"火", "木"}, "丁": {"火", "木"},
        "戊": {"土", "火"}, "己": {"土", "火"},
        "庚": {"金", "土"}, "辛": {"金", "土"},
        "壬": {"水", "金"}, "癸": {"水", "金"}
    }
    d_strong_els = strong_elements.get(day_stem, set())
    strong_count = 0
    for c in chars:
        if c in STEMS and STEMS[c]["element"] in d_strong_els:
            strong_count += 1
        elif c in BRANCH_ELEMENTS and BRANCH_ELEMENTS[c] in d_strong_els:
            strong_count += 1
    ilgan_strength = "신강" if strong_count >= 4 else "신약"
    
    # 2. Yongshin (용신) - Based on Saju PDF rules (Cheongan Yongshin & Johoo Yongshin)
    # Determine Cheongan (wonguk) Yongshin based on day stem (ilgan)
    cheongan_yongshin_map = {
        "甲": "丁 · 戊",
        "乙": "丁",
        "丙": "壬 · 甲",
        "丁": "甲 · 庚",
        "戊": "丙 · 甲",
        "己": "丙 · 乙",
        "庚": "丙",
        "辛": "戊 · 甲",
        "壬": "丙 · 戊",
        "癸": "丙 · 戊",
    }
    c_yongshin = cheongan_yongshin_map.get(day_stem, "丙 · 甲")
    
    # Determine Johoo Yongshin based on month branch (월지)
    month_branch = saju.get("month_branch", "")
    if month_branch in ["辰", "戌", "丑", "未"]: # 진술축미 토월생 (Earth months)
        j_yongshin = "木 (소토)"
    elif month_branch in ["寅", "卯"]: # 봄생 (Spring)
        j_yongshin = "木 · 火"
    elif month_branch in ["巳", "午"]: # 여름생 (Summer)
        j_yongshin = "金 · 水"
    elif month_branch in ["申", "酉"]: # 가을생 (Autumn)
        j_yongshin = "木 · 火"
    elif month_branch in ["亥", "子"]: # 겨울생 (Winter)
        j_yongshin = "木 · 火"
    else:
        j_yongshin = "木 · 火"
        
    yongshin = f"{c_yongshin} (조후: {j_yongshin})"
    
    # 3. Gyeokguk (격국)
    month_branch = saju.get("month_branch", "")
    month_branch_main = BRANCH_MAIN_STEM.get(month_branch, "")
    sipseong_m = get_sipseong(day_stem, month_branch_main)
    if sipseong_m == "비견":
        gyeokguk = "건록격"
    elif sipseong_m == "겁재":
        gyeokguk = "양인격"
    elif sipseong_m:
        gyeokguk = sipseong_m + "격"
    else:
        gyeokguk = "일반격"
        
    # 4. Branch Relations (지지 관계)
    branch_relations_list = []
    h_b = saju.get("hour_branch", "")
    d_b = saju.get("day_branch", "")
    m_b = saju.get("month_branch", "")
    y_b = saju.get("year_branch", "")
    
    active_branches = [b for b in [h_b, d_b, m_b, y_b] if b and b != "?"]
    
    # Check clashes
    clash_pairs_found = []
    for i in range(len(active_branches)):
        for j in range(i+1, len(active_branches)):
            b1, b2 = active_branches[i], active_branches[j]
            if {b1, b2} in BRANCH_CLASHES:
                clash_pairs_found.append(f"{b1}{b2}")
    for cp in set(clash_pairs_found):
        branch_relations_list.append({
            "type": "clash",
            "label": f"■ {cp[0]}{cp[1]} 충"
        })
        
    # Check 6 combinations
    hap_6_pairs_found = []
    for i in range(len(active_branches)):
        for j in range(i+1, len(active_branches)):
            b1, b2 = active_branches[i], active_branches[j]
            if {b1, b2} in BRANCH_HAPS_6:
                hap_6_pairs_found.append(f"{b1}{b2}")
    for hp in set(hap_6_pairs_found):
        branch_relations_list.append({
            "type": "hap6",
            "label": f"▲ {hp[0]}{hp[1]} 합"
        })
        
    # Check Samhap / Banhap
    samhap_info = [
        ({"申", "子", "辰"}, "수국"),
        ({"亥", "卯", "未"}, "목국"),
        ({"寅", "午", "戌"}, "화국"),
        ({"巳", "酉", "丑"}, "금국")
    ]
    b_set = set(active_branches)
    for sh_set, element_name in samhap_info:
        intersection = b_set.intersection(sh_set)
        if len(intersection) == 3:
            sh_ordered = [x for x in ["申", "子", "辰", "亥", "卯", "未", "寅", "午", "戌", "巳", "酉", "丑"] if x in intersection]
            branch_relations_list.append({
                "type": "samhap",
                "label": f"● {''.join(sh_ordered)} 삼합 ({element_name})"
            })
        elif len(intersection) == 2:
            # Need to have the center character (자, 묘, 오, 유) for semi-samhap (반합) to count strongly
            center_chars = {"子", "卯", "午", "酉"}
            has_center = len(intersection.intersection(center_chars)) > 0
            if has_center:
                sh_ordered = [x for x in ["申", "子", "辰", "亥", "卯", "未", "寅", "午", "戌", "巳", "酉", "丑"] if x in intersection]
                branch_relations_list.append({
                    "type": "banhap",
                    "label": f"● {''.join(sh_ordered)} 반합 ({element_name})"
                })
                
    # Check seasonal Banghap (巳午, 寅卯, 申酉, 亥子)
    banghap_pairs = [
        ({"寅", "卯"}, "목국"), ({"卯", "辰"}, "목국"), ({"寅", "辰"}, "목국"),
        ({"巳", "午"}, "화국"), ({"午", "未"}, "화국"), ({"巳", "未"}, "화국"),
        ({"申", "酉"}, "금국"), ({"酉", "戌"}, "금국"), ({"申", "戌"}, "금국"),
        ({"亥", "子"}, "수국"), ({"子", "丑"}, "수국"), ({"亥", "丑"}, "수국")
    ]
    # Filter only if not already covered by samhap/banhap elements
    for bh_set, element_name in banghap_pairs:
        if len(b_set.intersection(bh_set)) == 2:
            bh_ordered = [x for x in ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"] if x in bh_set]
            # check if already in list to avoid duplicates
            label = f"▲ {''.join(bh_ordered)} 합"
            if not any(x["label"] == label for x in branch_relations_list):
                branch_relations_list.append({
                    "type": "banghap",
                    "label": label
                })

    return {
        "name": name,
        "gender": gender,
        "solar_date": solar_date_str,
        "lunar_date": lunar_date_str,
        "birth_year": y,
        "current_age": current_age,
        "current_year": current_year,
        "element_counts": element_counts,
        "pillars": pillars,
        "daewoons": daewoons,
        "daewoon_direction": d_direction,
        "daewoon_num": daewoon_num,
        "current_daewoon_idx": current_daewoon_idx,
        "sewoons": sewoons,
        "selected_year": selected_year,
        "woluun": woluun,
        "yongshin": yongshin,
        "gyeokguk": gyeokguk,
        "ilgan_strength": ilgan_strength,
        "branch_relations": branch_relations_list
    }

def get_calendar_data(year, month):
    import calendar
    from sajupy import calculate_saju
    
    # Get number of days and first weekday (0 = Monday, 6 = Sunday)
    first_weekday, num_days = calendar.monthrange(year, month)
    
    # Sunday-first offset: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    # Python's weekday: 0 = Monday, ..., 6 = Sunday
    # So if first_weekday is 0 (Mon), Sunday-first offset is 1.
    # If first_weekday is 6 (Sun), Sunday-first offset is 0.
    start_offset = (first_weekday + 1) % 7
    
    days = []
    for d in range(1, num_days + 1):
        try:
            # We calculate Saju for the day at noon (12:00) to get the day pillar
            saju = calculate_saju(year, month, d, 12, 0)
            stem = saju.get("day_stem", "")
            branch = saju.get("day_branch", "")
            korean = saju.get("day_pillar", "")
            
            days.append({
                "day": d,
                "stem": stem,
                "branch": branch,
                "korean": korean,
                "stem_color": get_element_color(stem),
                "branch_color": get_element_color(branch)
            })
        except Exception as e:
            days.append({
                "day": d,
                "stem": "",
                "branch": "",
                "korean": "",
                "stem_color": "gray",
                "branch_color": "gray"
            })
            
    return {
        "year": year,
        "month": month,
        "start_offset": start_offset,
        "days": days
    }



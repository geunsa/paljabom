// State Management
let currentSaju = null;
let compatSaju1 = null;
let compatSaju2 = null;
let selectedGender = "남성";
let selectedCalendar = "양력";
let selectedHourOffset = 21; // Default to 亥시 (21)
let selectedDaewoonIdx = null;
let selectedSewoonYear = null;
let showOptions = {
  sipseong: false,
  sinsal: false,
  unseong: false,
  relations: true
};
let currentSort = "nameAsc"; // "nameAsc" | "nameDesc" | "recent"

// Helper Maps for Elements and Colors
const STEM_KOREAN = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};
const BRANCH_KOREAN = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

const getElementColorClass = (color) => {
  const map = { green: 'wood', red: 'fire', yellow: 'earth', white: 'metal', black: 'water' };
  return map[color] || 'metal';
};

const getSajuHourName = (hour, isUnknown) => {
  if (isUnknown) return "시모름";
  const h = parseInt(hour);
  if (isNaN(h)) return "시간미정";
  if (h >= 23 || h < 1) return "자시";
  if (h >= 1 && h < 3) return "축시";
  if (h >= 3 && h < 5) return "인시";
  if (h >= 5 && h < 7) return "묘시";
  if (h >= 7 && h < 9) return "진시";
  if (h >= 9 && h < 11) return "사시";
  if (h >= 11 && h < 13) return "오시";
  if (h >= 13 && h < 15) return "미시";
  if (h >= 15 && h < 17) return "신시";
  if (h >= 17 && h < 19) return "유시";
  if (h >= 19 && h < 21) return "술시";
  return "해시";
};

// ══ 1. Page Routing ══
function showPageTab(pageId) {
  const pages = ["pageInput", "pageSaved", "pageResult", "pageMemo"];
  pages.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.remove("show");
  });
  
  const map = {
    input: "pageInput",
    saved: "pageSaved",
    result: "pageResult",
    memo: "pageMemo"
  };
  
  const targetPage = document.getElementById(map[pageId]);
  if (targetPage) targetPage.classList.add("show");
  
  // Highlight bottom navigation items
  document.querySelectorAll(".bnav .nb").forEach(item => item.classList.remove("on"));
  
  const navMap = {
    input: "nbInput",
    saved: "nbSaved",
    result: "nbResult",
    memo: "nbMemo"
  };
  const targetNav = document.getElementById(navMap[pageId]);
  if (targetNav) targetNav.classList.add("on");

  // Load resources if needed
  if (pageId === "saved") {
    renderProfilesList();
  }
  
  if (pageId === "result") {
    setTimeout(resizeGlobalCanvas, 200);
  }
}

// ══ 2. Inputs Handling ══
function selectGender(gender) {
  selectedGender = gender;
  document.getElementById("btnGenderMale").classList.toggle("sel", gender === "남성");
  document.getElementById("btnGenderFemale").classList.toggle("sel", gender === "여성");
}

function selectCalendar(calType) {
  selectedCalendar = calType;
  document.getElementById("btnCalSolar").classList.toggle("sel-g", calType === "양력");
  document.getElementById("btnCalLunar").classList.toggle("sel-g", calType === "음력");
  document.getElementById("btnCalLeap").classList.toggle("sel-g", calType === "윤달");
}

function selectTime(el) {
  document.querySelectorAll("#timeGrid .tcell").forEach(cell => cell.classList.remove("sel"));
  el.classList.add("sel");
  selectedHourOffset = parseInt(el.getAttribute("data-hour"));
}

function fillFormInputs(name, birthdate, gender = "남성", calType = "양력", hour = 21) {
  document.getElementById("nameIn").value = name;
  document.getElementById("birthIn").value = birthdate;
  selectGender(gender);
  selectCalendar(calType);
  
  // Select time cell
  document.querySelectorAll("#timeGrid .tcell").forEach(cell => {
    const cellHour = parseInt(cell.getAttribute("data-hour"));
    if (cellHour === hour) {
      selectTime(cell);
    }
  });
}

// ══ 3. API Communication ══
async function submitSajuForm() {
  compatSaju1 = null;
  compatSaju2 = null;
  const name = document.getElementById("nameIn").value.trim();
  const birthdate = document.getElementById("birthIn").value.trim();
  
  if (!name) {
    alert("이름을 입력해주세요.");
    return;
  }
  if (!birthdate || birthdate.length !== 8) {
    alert("생년월일 8자리를 입력해주세요. (예: 19801231)");
    return;
  }
  
  const year = parseInt(birthdate.substring(0, 4));
  const month = parseInt(birthdate.substring(4, 6));
  const day = parseInt(birthdate.substring(6, 8));
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    alert("올바른 날짜 형식이 아닙니다.");
    return;
  }
  
  // Mapped hour / minute
  let hourVal = 12;
  let minuteVal = 0;
  let unknownTime = false;
  
  if (selectedHourOffset === -1) {
    unknownTime = true;
  } else {
    hourVal = selectedHourOffset;
  }
  
  // Save search to recent list
  saveRecentSearch(name, birthdate, selectedGender, selectedCalendar, selectedHourOffset);
  
  try {
    const payload = {
      name,
      gender: selectedGender,
      calendar_type: selectedCalendar === "윤달" ? "음력(윤달)" : selectedCalendar,
      year,
      month,
      day,
      hour: hourVal,
      minute: minuteVal,
      unknown_time: unknownTime
    };
    
    const response = await fetch(`${window.BACKEND_API_BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const resData = await response.json();
    if (resData.success) {
      currentSaju = resData.data;
      currentSaju._originalPayload = payload;
      
      // Auto-prepopulate needed colors in memo pad
      initializeMemoWithColors(currentSaju);
      
      // Render
      renderSajuResultsPage();
      
      // Switch view
      showPageTab("result");
    } else {
      alert(resData.detail || "명식 계산 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 연결 실패. 백엔드가 구동 중인지 확인해 주세요.");
  }
}

async function saveInputProfileDirectly() {
  const name = document.getElementById("nameIn").value.trim();
  const birthdate = document.getElementById("birthIn").value.trim();
  
  if (!name) {
    alert("이름을 입력해주세요.");
    return;
  }
  if (!birthdate || birthdate.length !== 8) {
    alert("생년월일 8자리를 입력해주세요. (예: 19801231)");
    return;
  }
  
  const year = parseInt(birthdate.substring(0, 4));
  const month = parseInt(birthdate.substring(4, 6));
  const day = parseInt(birthdate.substring(6, 8));
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    alert("올바른 날짜 형식이 아닙니다.");
    return;
  }
  
  let hourVal = 12;
  let minuteVal = 0;
  let unknownTime = false;
  
  if (selectedHourOffset === -1) {
    unknownTime = true;
  } else {
    hourVal = selectedHourOffset;
  }
  
  const saveBtn = document.getElementById("btnDirectSave");
  try {
    const payload = {
      name,
      gender: selectedGender,
      calendar_type: selectedCalendar === "윤달" ? "음력(윤달)" : selectedCalendar,
      year,
      month,
      day,
      hour: hourVal,
      minute: minuteVal,
      unknown_time: unknownTime
    };
    
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = "저장 중...";
    }
    
    const response = await fetch(`${window.BACKEND_API_BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const resData = await response.json();
    if (resData.success) {
      const sajuData = resData.data;
      
      let birthtimeStr = "";
      if (!unknownTime) {
        birthtimeStr = String(hourVal).padStart(2, '0') + "00";
      }
      
      const newProfile = {
        id: Date.now(),
        name: name,
        gender: selectedGender,
        calendar_type: selectedCalendar,
        birthdate: birthdate,
        birthtime: birthtimeStr,
        unknown_time: unknownTime,
        solar_date_str: sajuData.solar_date,
        lunar_date_str: sajuData.lunar_date,
        date_saved: new Date().toISOString()
      };
      
      saveProfileToList(newProfile);
      alert(`"${name}" 프로필이 저장되었습니다.`);
      
      // 저장 목록 탭으로 전환 및 리스트 갱신
      renderProfilesList();
      showPageTab("saved");
    } else {
      alert(resData.detail || "프로필 저장 중 계산 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 연결 실패. 백엔드가 구동 중인지 확인해 주세요.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        현재 입력 정보 저장하기
      `;
    }
  }
}

function editCurrentCalculatedProfile() {
  if (!currentSaju || !currentSaju._originalPayload) {
    alert("수정할 수 있는 원본 명식 데이터가 없습니다.");
    return;
  }
  const payload = currentSaju._originalPayload;
  
  // 1. 이름 복원
  document.getElementById("nameIn").value = payload.name;
  
  // 2. 생년월일 복원 (8자리 문자열 결합)
  const yStr = String(payload.year);
  const mStr = String(payload.month).padStart(2, '0');
  const dStr = String(payload.day).padStart(2, '0');
  document.getElementById("birthIn").value = yStr + mStr + dStr;
  
  // 3. 성별 복원
  selectGender(payload.gender);
  
  // 4. 양음력 복원
  let calType = payload.calendar_type;
  if (calType === "음력(윤달)") calType = "윤달";
  selectCalendar(calType);
  
  // 5. 출생시간 복원
  const hourVal = payload.unknown_time ? -1 : payload.hour;
  selectedHourOffset = hourVal;
  
  document.querySelectorAll("#timeGrid .tcell").forEach(cell => {
    const cellHour = parseInt(cell.getAttribute("data-hour"));
    if (cellHour === hourVal) {
      cell.classList.add("sel");
    } else {
      cell.classList.remove("sel");
    }
  });
  
  // 6. 입력 페이지로 전환
  showPageTab("input");
}

// ══ 4. Results Rendering ══
function renderSajuResultsPage() {
  if (!currentSaju) return;

  
  // 1. Top Header details
  const genderKo = currentSaju.gender === "남성" ? "남" : (currentSaju.gender === "여성" ? "여" : "");
  const genderDisplay = genderKo ? `${genderKo}, ` : "";
  document.getElementById("topHeaderName").innerHTML = `${currentSaju.name} <span style="font-size:11px;color:rgba(245,200,120,0.55); font-family:sans-serif;">(${genderDisplay}${currentSaju.current_age}세)</span>`;
  document.getElementById("topHeaderDates").innerHTML = `
    (양) ${currentSaju.solar_date}<br>
    (음) ${currentSaju.lunar_date}
  `;
  
  // 2. Relations Row (충/합)
  const relsContainer = document.getElementById("relationsRow");
  relsContainer.innerHTML = "";
  
  const pillarsKeys = ["hour", "day", "month", "year"];
  const relationLabels = {
    "hour": currentSaju.pillars.hour.relation_label,
    "day": currentSaju.pillars.day.relation_label,
    "month": currentSaju.pillars.month.relation_label,
    "year": currentSaju.pillars.year.relation_label
  };
  
  let hasRelations = false;
  pillarsKeys.forEach(key => {
    const label = relationLabels[key] || "";
    const labelClean = label.replace(/[■▲●●]/g, '').trim();
    
    let cellBg = "#fff";
    let cellColor = "#333";
    
    if (labelClean.includes("충")) {
      cellBg = "#FEF2F2";
      cellColor = "#991B1B";
    } else if (labelClean.includes("합")) {
      cellBg = "#FFFBEB";
      cellColor = "#92400E";
    }
    
    const displayLabel = labelClean ? labelClean.split(" ")[1] || labelClean : "";
    if (displayLabel) hasRelations = true;
    
    relsContainer.innerHTML += `<div class="rel-cell" style="background:${cellBg}; color:${cellColor};">${displayLabel}</div>`;
  });
  
  relsContainer.style.display = (showOptions.relations && hasRelations) ? "grid" : "none";
  
  // 3. Pillars Tiles
  const pillarGrid = document.getElementById("pillarRow");
  pillarGrid.innerHTML = "";
  
  pillarsKeys.forEach(key => {
    const p = currentSaju.pillars[key];
    const isDay = key === "day";
    
    const stemColClass = getElementColorClass(p.stem_color);
    const branchColClass = getElementColorClass(p.branch_color);
    
    const stemKorean = STEM_KOREAN[p.stem] || p.stem;
    const branchKorean = BRANCH_KOREAN[p.branch] || p.branch;
    
    const sipseongBranchLabel = p.sipseong_branch;
    const sipseongStemLabel = isDay ? "본인" : p.sipseong_stem;
    
    const sipseongHtml = showOptions.sipseong ? `
      <div class="pillar-overlay-label" style="color:var(--${p.stem_color}); font-weight:700;">${sipseongStemLabel}</div>
      <div class="pillar-overlay-label" style="color:var(--${p.branch_color}); opacity:0.85; font-weight:700;">${sipseongBranchLabel}</div>
    ` : "";
    
    const sinsalHtml = showOptions.sinsal && p.sinsal && p.sinsal.length > 0 ? `
      <div class="pillar-overlay-label" style="color:var(--pink-dk); font-size: 8.5px;">${p.sinsal.join(', ')}</div>
    ` : "";
    
    const unseongHtml = showOptions.unseong && p.unseong ? `
      <div class="pillar-overlay-label" style="color:var(--muted); font-size: 8.5px;">${p.unseong}</div>
    ` : "";
    
    const meDotHtml = isDay ? `<span class="me-dot">나</span>` : "";
    
    pillarGrid.innerHTML += `
      <div class="pillar">
        <div class="hanja ${stemColClass}-dk">
          <span class="h-korean">${stemKorean}</span>
          <span class="h-chinese">${p.stem}</span>
          ${meDotHtml}
        </div>
        <div class="hanja ${branchColClass}-lt">
          <span class="h-korean">${branchKorean}</span>
          <span class="h-chinese">${p.branch}</span>
        </div>
        <div class="p-jz">${p.hidden_stems.join('')}</div>
        ${sipseongHtml}
        ${unseongHtml}
        ${sinsalHtml}
      </div>
    `;
  });
  
  // 4. Elements Counts (오행 막대 - 안전 처리)
  const ohengContainer = document.getElementById("elementsCountsRow");
  if (ohengContainer) {
    ohengContainer.innerHTML = "";
    
    const ohengList = [
      { name: '목', char: '木', class: 'wood' },
      { name: '화', char: '火', class: 'fire' },
      { name: '토', char: '土', class: 'earth' },
      { name: '금', char: '金', class: 'metal' },
      { name: '수', char: '水', class: 'water' }
    ];
    
    ohengList.forEach(el => {
      const count = currentSaju.element_counts[el.name] || 0;
      ohengContainer.innerHTML += `
        <div class="ohi">
          <div class="ohc ${el.class}-lt" style="color:var(--${el.class}); font-weight:700;">${el.char}</div>
          <div class="ohcnt" style="color:var(--${el.class});">${count}</div>
        </div>
      `;
    });
  }
  
  // 5. Summary Cells (안전 처리)
  const yongshinEl = document.getElementById("yongshinVal");
  if (yongshinEl) yongshinEl.textContent = currentSaju.yongshin;
  
  const gyeokgukEl = document.getElementById("gyeokgukVal");
  if (gyeokgukEl) gyeokgukEl.textContent = currentSaju.gyeokguk;
  
  const strengthEl = document.getElementById("strengthVal");
  if (strengthEl) strengthEl.textContent = currentSaju.ilgan_strength;
  
  // 6. Daewoon scroll list
  selectedDaewoonIdx = currentSaju.current_daewoon_idx;
  renderDaewoonList();
  
  // 7. Sewoon grid list
  selectedSewoonYear = currentSaju.selected_year;
  renderSewoonGrid();
  
  // 8. Woluun scroll list
  renderWoluunList();
  
  // Hide calendar section initially unless loaded
  document.getElementById("calendarSection").style.display = "none";
  
  // Resize canvas after layout updates
  setTimeout(resizeGlobalCanvas, 200);
}

function renderDaewoonList() {
  const container = document.getElementById("daewoonList");
  container.innerHTML = "";
  
  document.getElementById("daewoonHeaderInfo").textContent = `대운수: ${currentSaju.daewoon_num} · ${currentSaju.daewoon_direction}`;
  
  currentSaju.daewoons.forEach((d, idx) => {
    const isNow = idx === selectedDaewoonIdx;
    const stemCol = getElementColorClass(d.stem_color);
    const branchCol = getElementColorClass(d.branch_color);
    
    container.innerHTML += `
      <div class="dw-item" onclick="onDaewoonClick(${idx}, ${d.age})">
        <div class="dw-age ${isNow ? 'now-age' : ''}">${d.age}세 ${isNow ? '★' : ''}</div>
        <div class="dw-top ${isNow ? 'now-top' : `${stemCol}-lt`}">${d.stem}</div>
        <div class="dw-bot ${isNow ? 'now-bot' : `${branchCol}-lt`}">${d.branch}</div>
        <div class="dw-yr ${isNow ? 'now-yr' : ''}">${currentSaju.birth_year + d.age - 1}</div>
      </div>
    `;
  });
  
  // Center scroll around active item
  setTimeout(() => {
    const activeEl = container.querySelector(".now-age");
    if (activeEl) {
      activeEl.parentElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, 100);
}

function renderSewoonGrid() {
  const container = document.getElementById("sewoonGrid");
  container.innerHTML = "";
  
  currentSaju.sewoons.forEach(s => {
    const isNow = s.year === selectedSewoonYear;
    const stemCol = getElementColorClass(s.stem_color);
    const branchCol = getElementColorClass(s.branch_color);
    
    container.innerHTML += `
      <div class="sw-item" onclick="onSewoonClick(${s.year})">
        <div class="sw-yr ${isNow ? 'now-yr' : ''}">${s.year} ${isNow ? '★' : ''}</div>
        <div class="sw-top ${isNow ? 'now-top' : `${stemCol}-lt`}">${s.stem}</div>
        <div class="sw-bot ${isNow ? 'now-bot' : `${branchCol}-lt`}">${s.branch}</div>
      </div>
    `;
  });
}

function renderWoluunList() {
  const container = document.getElementById("woluunList");
  container.innerHTML = "";
  
  document.getElementById("woluunHeaderLabel").textContent = `${selectedSewoonYear}년 월운 · 양력`;
  
  const currentMonth = new Date().getMonth() + 1;
  const isCurrentYear = selectedSewoonYear === new Date().getFullYear();
  
  // Display chronologically (1월 to 12월)
  const sortedWoluun = [...currentSaju.woluun].sort((a, b) => a.month - b.month);
  
  sortedWoluun.forEach(w => {
    const isNowMonth = isCurrentYear && w.month === currentMonth;
    const stemCol = getElementColorClass(w.stem_color);
    const branchCol = getElementColorClass(w.branch_color);
    
    container.innerHTML += `
      <div class="mw-item" onclick="loadDailyCalendar(${w.month})">
        <div class="mw-m" style="${isNowMonth ? 'color:#D4689A; font-weight:700;' : ''}">${w.month}월${isNowMonth ? ' (현재)' : ''}</div>
        <div class="mw-top ${isNowMonth ? 'now-top' : `${stemCol}-lt`}">${w.stem}</div>
        <div class="mw-bot ${isNowMonth ? 'now-bot' : `${branchCol}-lt`}">${w.branch}</div>
      </div>
    `;
  });
}

// Option chips toggle
function toggleOptionChip(el, optionKey) {
  showOptions[optionKey] = !showOptions[optionKey];
  
  const isOn = showOptions[optionKey];
  el.classList.toggle("on", isOn);
  
  const svg = el.querySelector("svg");
  if (isOn) {
    svg.innerHTML = '<rect x="1" y="1" width="12" height="12" rx="2"/><polyline points="3,7 5.5,9.5 11,4" stroke-width="1.8"/>';
  } else {
    svg.innerHTML = '<rect x="1" y="1" width="12" height="12" rx="2"/>';
  }
  
  // Re-render
  renderSajuResultsPage();
}

// Click events for Daewoon & Sewoon
async function onDaewoonClick(idx, age) {
  selectedDaewoonIdx = idx;
  renderDaewoonList();
  
  try {
    const res = await fetch(`${window.BACKEND_API_BASE}/api/sewoon?age=${age}&birth_year=${currentSaju.birth_year}&daewoon_num=${currentSaju.daewoon_num}`);
    const result = await res.json();
    if (result.success) {
      currentSaju.sewoons = result.sewoons;
      const firstYear = result.sewoons[0].year;
      selectedSewoonYear = firstYear;
      
      renderSewoonGrid();
      await onSewoonClick(firstYear);
    }
  } catch (err) {
    console.error("Daewoon click fetch failed:", err);
  }
}

async function onSewoonClick(year) {
  selectedSewoonYear = year;
  renderSewoonGrid();
  
  try {
    const res = await fetch(`${window.BACKEND_API_BASE}/api/woluun?year=${year}`);
    const result = await res.json();
    if (result.success) {
      currentSaju.woluun = result.woluun;
      renderWoluunList();
      
      // Hide calendar until they click a month
      document.getElementById("calendarSection").style.display = "none";
      setTimeout(resizeGlobalCanvas, 200);
    }
  } catch (err) {
    console.error("Sewoon click fetch failed:", err);
  }
}

// ══ 5. Daily Calendar (일진 달력) ══
async function loadDailyCalendar(monthNum) {
  document.getElementById("calendarHeaderLabel").textContent = `일진 달력 · ${selectedSewoonYear}년 ${monthNum}월`;
  const container = document.getElementById("calendarGrid");
  container.innerHTML = "";
  
  try {
    const res = await fetch(`${window.BACKEND_API_BASE}/api/calendar?year=${selectedSewoonYear}&month=${monthNum}`);
    const result = await res.json();
    
    if (result.success) {
      const cal = result.data;
      
      // Display Header
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      weekdays.forEach(w => {
        const cls = w === '일' ? 'sun' : w === '토' ? 'sat' : '';
        container.innerHTML += `<div style="font-size:9px;color:${cls === 'sun' ? '#E05050' : cls === 'sat' ? 'var(--water)' : 'var(--muted)'};padding:3px 0;font-family:sans-serif;">${w}</div>`;
      });
      
      // Empty offset cells
      for (let i = 0; i < cal.start_offset; i++) {
        container.innerHTML += `<div class="calendar-day-cell empty"></div>`;
      }
      
      // Day cells
      const today = new Date();
      const isCurrentMonthYear = today.getFullYear() === selectedSewoonYear && (today.getMonth() + 1) === monthNum;
      const todayDay = today.getDate();
      
      cal.days.forEach(d => {
        const isTodayCell = isCurrentMonthYear && d.day === todayDay;
        const weekdayIdx = (cal.start_offset + d.day - 1) % 7;
        const isSun = weekdayIdx === 0;
        const isSat = weekdayIdx === 6;
        
        let extraCls = isSun ? 'sun' : isSat ? 'sat' : '';
        if (isTodayCell) extraCls = 'current-day';
        
        container.innerHTML += `
          <div class="calendar-day-cell ${extraCls}">
            <div class="day-num">${d.day}</div>
            <div class="day-ganji">${d.korean || ''}</div>
          </div>
        `;
      });
      
      // Display Section
      document.getElementById("calendarSection").style.display = "block";
      
      // Scroll calendar into view
      setTimeout(() => {
        document.getElementById("calendarSection").scrollIntoView({ behavior: 'smooth', block: 'end' });
        resizeGlobalCanvas();
      }, 150);
      
    }
  } catch (err) {
    console.error("Calendar fetch failed:", err);
  }
}

// ══ 6. Saved Profiles Management ══
function getSavedProfiles() {
  const stored = localStorage.getItem("dalkom_mobile_profiles");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

function saveProfileToList(profile) {
  const list = getSavedProfiles();
  
  // Avoid duplicate by details
  const filtered = list.filter(p => !(p.name === profile.name && p.birthdate === profile.birthdate));
  filtered.unshift(profile);
  
  localStorage.setItem("dalkom_mobile_profiles", JSON.stringify(filtered));
}

function saveCurrentCalculatedProfile() {
  if (!currentSaju) {
    alert("조회된 사주가 없습니다. 먼저 사주를 조회해 주세요.");
    return;
  }
  
  const defaultLabel = currentSaju.name;
  const promptName = prompt("저장할 고객 프로필 이름을 입력해주세요:", defaultLabel);
  
  if (!promptName) return;
  
  // Parse hour details from pillars
  let birthtimeStr = "";
  let isUnknown = true;
  
  // Find mapped selected hour from state
  const timeCell = document.querySelector("#timeGrid .tcell.sel");
  let hourVal = 21;
  if (timeCell) {
    hourVal = parseInt(timeCell.getAttribute("data-hour"));
    if (hourVal !== -1) {
      isUnknown = false;
      birthtimeStr = String(hourVal).padStart(2, '0') + "00";
    }
  }
  
  const birthdateStr = String(currentSaju.birth_year) + 
                       String(currentSaju.solar_date.match(/\d+월/)[0].replace('월','')).padStart(2,'0') + 
                       String(currentSaju.solar_date.match(/\d+일/)[0].replace('일','')).padStart(2,'0');

  const newProfile = {
    id: Date.now(),
    name: promptName,
    gender: currentSaju.gender,
    calendar_type: selectedCalendar,
    birthdate: birthdateStr,
    birthtime: birthtimeStr,
    unknown_time: isUnknown,
    solar_date_str: currentSaju.solar_date,
    lunar_date_str: currentSaju.lunar_date,
    date_saved: new Date().toISOString()
  };
  
  saveProfileToList(newProfile);
  alert(`"${promptName}" 프로필이 저장되었습니다.`);
  
  // Update saved list immediately
  renderProfilesList();
}

function deleteSavedProfile(event, id) {
  event.stopPropagation(); // prevent loading Saju on click
  if (!window.confirm("이 프로필을 삭제하시겠습니까?")) return;
  
  const list = getSavedProfiles();
  const filtered = list.filter(p => p.id !== id);
  localStorage.setItem("dalkom_mobile_profiles", JSON.stringify(filtered));
  
  renderProfilesList();
}

async function loadSavedProfile(id) {
  const list = getSavedProfiles();
  const profile = list.find(p => p.id === id);
  if (!profile) return;
  
  // Pre-fill inputs
  fillFormInputs(profile.name, profile.birthdate, profile.gender, profile.calendar_type, profile.unknown_time ? -1 : parseInt(profile.birthtime.substring(0, 2)));
  
  // Submit automatically
  await submitSajuForm();
}

function changeSort(sortType) {
  currentSort = sortType;
  
  document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.remove("sel"));
  if (sortType === 'nameAsc') document.getElementById("sortNameAsc").classList.add("sel");
  if (sortType === 'nameDesc') document.getElementById("sortNameDesc").classList.add("sel");
  if (sortType === 'recent') document.getElementById("sortRecent").classList.add("sel");
  
  renderProfilesList();
}

function renderProfilesList() {
  const container = document.getElementById("listWrap");
  container.innerHTML = "";
  
  let list = getSavedProfiles();
  const searchQ = document.getElementById("searchInput").value.trim().toLowerCase();
  
  // Filter by search query
  if (searchQ) {
    list = list.filter(p => p.name.toLowerCase().includes(searchQ));
  }
  
  // Sort
  if (currentSort === "nameAsc") {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } else if (currentSort === "nameDesc") {
    list.sort((a, b) => b.name.localeCompare(a.name, 'ko'));
  } else if (currentSort === "recent") {
    list.sort((a, b) => new Date(b.date_saved) - new Date(a.date_saved));
  }
  
  if (list.length === 0) {
    container.innerHTML = `<div style="padding:24px; text-align:center; color:var(--muted); font-size:12px;">저장된 사주 프로필이 없습니다.</div>`;
    return;
  }
  
  list.forEach((p, idx) => {
    // Determine avatar initial and color
    const initial = p.name ? p.name.charAt(0) : "?";
    let avClass = "av-u";
    let tagClass = "m-tag";
    let genderKo = "남";
    
    if (p.gender === "남성") {
      avClass = "av-m";
      tagClass = "m-tag";
      genderKo = "남";
    } else if (p.gender === "여성") {
      avClass = "av-f";
      tagClass = "f-tag";
      genderKo = "여";
    }
    
    const formattedTime = p.unknown_time ? "시간 모름" : `${p.birthtime.substring(0, 2)}시 ${p.birthtime.substring(2, 4)}분`;
    const isNewBadge = idx === 0 && currentSort === 'recent';
    
    container.innerHTML += `
      <div class="list-item" onclick="loadSavedProfile(${p.id})">
        <div class="av ${avClass}">${initial}</div>
        <div class="item-info">
          <div class="item-name">${p.name} <span class="gtag ${tagClass}">${genderKo}</span></div>
          <div class="item-date">
            (양) ${p.solar_date_str.split(',')[0]}, ${formattedTime}<br>
            (음) ${p.lunar_date_str}
          </div>
        </div>
        <div class="item-right">
          <svg class="arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D0C0CC" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          ${isNewBadge ? '<span class="badge">최근</span>' : ''}
          <span class="delete-btn" onclick="deleteSavedProfile(event, ${p.id})">삭제</span>
        </div>
      </div>
    `;
  });
}

function filterProfilesList() {
  renderProfilesList();
}

// ══ 7. Recent Search Chips ══
function getRecentSearches() {
  const stored = localStorage.getItem("dalkom_mobile_recent");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

function saveRecentSearch(name, birthdate, gender, calType, hour) {
  const list = getRecentSearches();
  
  // Remove duplicate
  const filtered = list.filter(item => !(item.name === name && item.birthdate === birthdate));
  
  // Insert at front
  filtered.unshift({ name, birthdate, gender, calType, hour });
  
  // Limit to 3 items
  if (filtered.length > 3) filtered.pop();
  
  localStorage.setItem("dalkom_mobile_recent", JSON.stringify(filtered));
  renderRecentSearchChips();
}

function renderRecentSearchChips() {
  const container = document.getElementById("recentSearches");
  container.innerHTML = `<span style="font-size:10px;color:var(--muted);font-family:sans-serif;align-self:center;">최근</span>`;
  
  const list = getRecentSearches();
  if (list.length === 0) {
    container.style.display = "none";
    return;
  }
  
  container.style.display = "flex";
  list.forEach(item => {
    container.innerHTML += `
      <div class="schip" onclick="fillFormInputs('${item.name}', '${item.birthdate}', '${item.gender}', '${item.calType}', ${item.hour})">
        <span class="dot"></span>${item.name}
        <span class="delete-recent-btn" onclick="deleteRecentSearch(event, '${item.name}', '${item.birthdate}')">✕</span>
      </div>
    `;
  });
}

function deleteRecentSearch(event, name, birthdate) {
  event.stopPropagation(); // Prevent filling inputs on chip click
  const list = getRecentSearches();
  const filtered = list.filter(item => !(item.name === name && item.birthdate === birthdate));
  localStorage.setItem("dalkom_mobile_recent", JSON.stringify(filtered));
  renderRecentSearchChips();
}

// ══ 8. Memo Section ══
function updateResultMemoDisplay() {
  const val = document.getElementById("memoTextArea").value.trim();
  const memoSec = document.getElementById("resultMemoSection");
  const memoContent = document.getElementById("resultMemoContent");
  if (memoSec && memoContent) {
    if (val) {
      memoSec.style.display = "block";
      memoContent.textContent = val;
    } else {
      memoSec.style.display = "none";
    }
  }
}

function initializeMemoWithColors(data) {
  const stemToElement = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  };
  const generatingElement = {
    '木': '水', '火': '木', '土': '火', '金': '土', '水': '金'
  };
  const elementToColor = {
    '木': '초록색 (木)', '火': '빨간색 (火)', '土': '황토색 (土)', '金': '흰색 (金)', '水': '검은색 (水)'
  };

  let note = `[사주 분석 요약]\n`;
  note += `👤 이름: ${data.name}\n`;
  note += `⚖️ 강약: ${data.ilgan_strength || '중화'}\n`;
  note += `🧩 격국: ${data.gyeokguk || '미정'}\n\n`;

  note += `[팔자봄 만세력 필요한 컬러]\n`;
  
  const dayStem = data.pillars?.day?.stem;
  const el = stemToElement[dayStem];
  if (el) {
    const genEl = generatingElement[el];
    note += `  - 나를 생하는 컬러: ${elementToColor[genEl]}\n`;
  }
  
  note += `\n[상담 기록]\n`;
  document.getElementById("memoTextArea").value = note;
  updateResultMemoDisplay();
}

function getSavedMemos() {
  const stored = localStorage.getItem("dalkom_mobile_memos");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

function renderMemosList() {
  const container = document.getElementById("notesListContainer");
  container.innerHTML = "";
  
  const list = getSavedMemos();
  if (list.length === 0) {
    container.innerHTML = `<div style="padding:12px 0; text-align:center; color:var(--muted); font-size:11.5px;">이전 메모가 없습니다.</div>`;
    return;
  }
  
  list.forEach(memo => {
    container.innerHTML += `
      <div class="nitem" onclick="loadMemoText('${memo.text}')">
        <div class="ndate">${memo.date} · ${memo.clientName}</div>
        <div class="nprev">${memo.preview}</div>
        <span class="ntag">${memo.tag}</span>
        <span class="delete-note-btn" onclick="deleteMemo(event, ${memo.id})">✕</span>
      </div>
    `;
  });
}

function saveMemoText() {
  const text = document.getElementById("memoTextArea").value.trim();
  if (!text) {
    alert("작성된 메모 내용이 없습니다.");
    return;
  }
  
  const clientName = currentSaju ? currentSaju.name : "익명";
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  const newMemo = {
    id: Date.now(),
    date: dateStr,
    clientName,
    preview: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
    text,
    tag: currentSaju ? '#개인' : '#기타'
  };
  
  const list = getSavedMemos();
  list.unshift(newMemo);
  localStorage.setItem("dalkom_mobile_memos", JSON.stringify(list));
  
  alert("메모가 저장되었습니다.");
  renderMemosList();
}

function deleteMemo(event, id) {
  event.stopPropagation(); // prevent loading note text on click
  if (!window.confirm("이 메모를 삭제하시겠습니까?")) return;
  
  const list = getSavedMemos();
  const filtered = list.filter(m => m.id !== id);
  localStorage.setItem("dalkom_mobile_memos", JSON.stringify(filtered));
  
  renderMemosList();
}

function loadMemoText(text) {
  document.getElementById("memoTextArea").value = text;
  updateResultMemoDisplay();
}

function clearMemoArea() {
  if (window.confirm("메모를 비우시겠습니까?")) {
    document.getElementById("memoTextArea").value = "";
    updateResultMemoDisplay();
  }
}

function appendMemoTag(tag) {
  const area = document.getElementById("memoTextArea");
  const prev = area.value;
  const spacer = prev ? (prev.endsWith('\n') ? '' : '\n') : '';
  area.value = prev + spacer + tag + ': ';
  area.focus();
  updateResultMemoDisplay();
}

// ══ 9. Drawing Capability (필기 기능) ══
let isDrawingMode = false;
let drawTool = 'pencil'; // 'pencil' | 'highlighter' | 'eraser' | 'star' | 'heart' | 'o' | 'x'
let penColor = '#E8402A';
let brushSize = 5;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];

// Multi-touch scroll tracking
let activePointers = new Map();
let isPanning = false;
let panStartY = 0;
let panStartScrollTop = 0;

function toggleDrawingMode() {
  isDrawingMode = !isDrawingMode;
  const canvas = document.getElementById("globalDrawingCanvas");
  const toggleBtn = document.getElementById("btnDrawToggle");
  const subRow = document.getElementById("drawSubRow");
  const pageResult = document.getElementById("pageResult");
  
  if (canvas && toggleBtn && subRow) {
    if (isDrawingMode) {
      if (pageResult) pageResult.classList.add("drawing-active");
      
      if (drawTool === 'pan') {
        canvas.classList.remove("active");
        canvas.style.pointerEvents = "none";
      } else {
        canvas.classList.add("active");
        canvas.style.pointerEvents = "auto"; // Override HTML inline pointer-events: none
      }
      toggleBtn.classList.add("active");
      toggleBtn.textContent = "🎨 필기 모드 ON";
      subRow.style.display = "flex";
      resizeGlobalCanvas(); // resize to current results page height
    } else {
      if (pageResult) pageResult.classList.remove("drawing-active");
      
      canvas.classList.remove("active");
      canvas.style.pointerEvents = "none"; // Restore HTML inline pointer-events: none
      toggleBtn.classList.remove("active");
      toggleBtn.textContent = "🎨 필기 모드 OFF";
      subRow.style.display = "none";
      resizeGlobalCanvas(); // resize back to normal results page height
    }
  }
}

function selectDrawTool(tool) {
  drawTool = tool;
  
  // Highlight active tool button
  document.querySelectorAll(".dt-tool").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tool") === tool);
  });

  const canvas = document.getElementById("globalDrawingCanvas");
  if (canvas) {
    if (tool === 'pan') {
      canvas.style.pointerEvents = "none";
      canvas.classList.remove("active");
    } else {
      canvas.style.pointerEvents = "auto";
      canvas.classList.add("active");
    }
  }

  // Set tool-specific sensible defaults for brushSize
  let defaultSize = 8;
  if (tool === 'pencil') defaultSize = 5;
  else if (tool === 'highlighter') defaultSize = 20;
  else if (tool === 'eraser') defaultSize = 25;
  else if (tool === 'pan') return;
  else defaultSize = 20; // stamps

  const slider = document.getElementById("thicknessSlider");
  if (slider) {
    slider.value = defaultSize;
    changeBrushSize(defaultSize);
  }
}

function changeBrushSize(val) {
  brushSize = parseInt(val);
  const valEl = document.getElementById("thicknessVal");
  if (valEl) {
    valEl.textContent = val + "px";
  }
}

function selectPenColor(color, el) {
  penColor = color;
  
  // Highlight active color dot
  document.querySelectorAll(".dt-colors .dt-color").forEach(dot => {
    dot.classList.remove("active");
  });
  if (el) el.classList.add("active");
}

function getCoordinates(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function getHighlighterColor(hex, opacity = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function drawStamp(x, y, tool, ctx) {
  ctx.save();
  ctx.fillStyle = penColor;
  const fontSize = Math.round(brushSize * 1.5);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = {
    star: '★',
    heart: '♥',
    o: '○',
    x: '✕'
  };
  ctx.fillText(chars[tool], x, y);
  ctx.restore();
}

function startDrawing(e) {
  if (!isDrawingMode || drawTool === 'pan') return;
  const canvas = document.getElementById("globalDrawingCanvas");
  if (!canvas) return;
  
  // Track pointer position
  activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
  
  // Check if this is a multi-touch panning gesture (2 or more fingers)
  if (activePointers.size >= 2) {
    isDrawing = false;
    isPanning = true;
    
    // Calculate average Y position
    let sumY = 0;
    activePointers.forEach(p => sumY += p.clientY);
    panStartY = sumY / activePointers.size;
    
    const container = document.getElementById("resultScrollContainer");
    if (container) {
      panStartScrollTop = container.scrollTop;
    }
    
    // Silent undo to clean up any stray line segment drawn before the second finger touched
    if (drawingHistory.length > 0) {
      handleUndoSilent();
    }
    return;
  }
  
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) {}
  
  const { x, y } = getCoordinates(e, canvas);
  
  saveCanvasState();
  lastX = x;
  lastY = y;
  
  const ctx = canvas.getContext("2d");
  if (drawTool === 'pencil' || drawTool === 'highlighter' || drawTool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawTool === 'highlighter' ? getHighlighterColor(penColor) : penColor;
      ctx.lineWidth = brushSize;
    }
    isDrawing = true;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    drawStamp(x, y, drawTool, ctx);
  }
}

function draw(e) {
  if (!isDrawingMode) return;
  
  // Update tracked pointer coordinates
  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
  }
  
  // If we are currently panning, scroll the container vertically
  if (isPanning) {
    if (activePointers.size >= 2) {
      let sumY = 0;
      activePointers.forEach(p => sumY += p.clientY);
      const currentY = sumY / activePointers.size;
      const diffY = currentY - panStartY;
      
      const container = document.getElementById("resultScrollContainer");
      if (container) {
        container.scrollTop = panStartScrollTop - diffY;
      }
    }
    return;
  }
  
  if (!isDrawing || drawTool === 'pan') return;
  if (drawTool !== 'pencil' && drawTool !== 'highlighter' && drawTool !== 'eraser') return;
  
  const canvas = document.getElementById("globalDrawingCanvas");
  if (!canvas) return;
  const { x, y } = getCoordinates(e, canvas);
  const ctx = canvas.getContext("2d");
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (drawTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = brushSize;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = drawTool === 'highlighter' ? getHighlighterColor(penColor) : penColor;
    ctx.lineWidth = brushSize;
  }
  
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  
  lastX = x;
  lastY = y;
}

function stopDrawing(e) {
  isDrawing = false;
  if (e) {
    activePointers.delete(e.pointerId);
  }
  if (activePointers.size < 2) {
    isPanning = false;
  }
  const canvas = document.getElementById("globalDrawingCanvas");
  if (canvas && e) {
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
  }
}

function handleUndoSilent() {
  const canvas = document.getElementById("globalDrawingCanvas");
  if (!canvas || drawingHistory.length === 0) return;
  const ctx = canvas.getContext("2d");
  
  const prevState = drawingHistory.pop();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const img = new Image();
  img.src = prevState;
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
  updateUndoButtonState();
}

function clearCanvas() {
  const canvas = document.getElementById("globalDrawingCanvas");
  if (canvas) {
    saveCanvasState();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function saveCanvasState() {
  const canvas = document.getElementById("globalDrawingCanvas");
  if (!canvas) return;
  const dataURL = canvas.toDataURL();
  drawingHistory.push(dataURL);
  if (drawingHistory.length > 25) {
    drawingHistory.shift();
  }
  updateUndoButtonState();
}

function handleUndo() {
  const canvas = document.getElementById("globalDrawingCanvas");
  if (!canvas || drawingHistory.length === 0) return;
  const ctx = canvas.getContext("2d");
  
  const prevState = drawingHistory.pop();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const img = new Image();
  img.src = prevState;
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
  updateUndoButtonState();
}

function updateUndoButtonState() {
  const btn = document.getElementById("btnUndo");
  if (!btn) return;
  btn.disabled = drawingHistory.length === 0;
}

function resizeGlobalCanvas() {
  const canvas = document.getElementById("globalDrawingCanvas");
  const container = document.getElementById("resultScrollContainer");
  if (!canvas || !container) return;
  
  const newW = container.scrollWidth;
  const newH = container.scrollHeight;
  if (newW === 0 || newH === 0) return;
  
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  
  if (canvas.width > 0 && canvas.height > 0) {
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);
  }
  
  canvas.width = newW;
  canvas.height = newH;
  
  if (tempCanvas.width > 0 && tempCanvas.height > 0) {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

function initDrawingCanvas() {
  const canvas = document.getElementById("globalDrawingCanvas");
  if (!canvas) return;
  
  // Pointer Events (unifies Mouse, Touch, Stylus/Pen!)
  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
  
  window.addEventListener("resize", resizeGlobalCanvas);
}

// ══ 10. Initialization ══
window.addEventListener("DOMContentLoaded", () => {
  // Update memo date header
  const today = new Date();
  const dateString = today.getFullYear() + '.' + String(today.getMonth() + 1).padStart(2, '0') + '.' + String(today.getDate()).padStart(2, '0');
  document.getElementById("memoDateDisplay").textContent = dateString;
  
  // Render storage and recents
  renderRecentSearchChips();
  renderProfilesList();
  renderMemosList();
  
  // Initialize canvas drawing
  initDrawingCanvas();

  // Sync text memo inputs with the result memo display
  const memoTextarea = document.getElementById("memoTextArea");
  if (memoTextarea) {
    memoTextarea.addEventListener("input", updateResultMemoDisplay);
  }
});

// ══ 11. Print & Export Image Functions ══
function printSajuResult() {
  window.print();
}

async function exportSajuAsImage() {
  const container = document.getElementById("resultScrollContainer");
  if (!container) return;
  
  // Show loading indicator
  const exportBtn = document.getElementById("exportImageBtn");
  if (exportBtn) {
    exportBtn.style.opacity = "0.5";
    exportBtn.style.pointerEvents = "none";
  }
  
  // Wait a small bit for UI to settle
  await new Promise(r => setTimeout(r, 100));
  
  try {
    // Capture the full height scroll area
    // Temporarily set overflow and height so html2canvas captures everything
    const originalStyle = container.getAttribute("style") || "";
    container.style.overflowY = "visible";
    container.style.height = "auto";
    
    const canvas = await html2canvas(container, {
      useCORS: true,
      scale: 2, // High resolution
      backgroundColor: "#F7F2E8", // Match var(--cream) background color
      logging: false,
      scrollY: -window.scrollY,
      scrollX: 0
    });
    
    // Restore original styles
    container.setAttribute("style", originalStyle);
    
    // Convert to image and trigger download
    const dataURL = canvas.toDataURL("image/png");
    const name = currentSaju ? currentSaju.name : "사주";
    const filename = `팔자봄_${name}_${new Date().toISOString().slice(0,10)}.png`;
    
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("사주 결과가 이미지 파일로 저장되었습니다!");
  } catch (err) {
    console.error("Export image failed:", err);
    alert("이미지 저장 중 오류가 발생했습니다.");
  } finally {
    if (exportBtn) {
      exportBtn.style.opacity = "1";
      exportBtn.style.pointerEvents = "auto";
    }
  }
}

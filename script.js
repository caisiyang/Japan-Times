let rawNewsData = [];
let lastUpdated = '';
let favorites = [];
try { favorites = JSON.parse(localStorage.getItem('favorites') || '[]'); } catch(e) {}

let currentFilter = 'all'; 
let searchQuery = '';      
let archiveData = {};
let currentLang = localStorage.getItem('language') || 'sc';
let currentTheme = localStorage.getItem('theme') || 'light';
let currentFont = localStorage.getItem('fontFamily') || 'serif';
let currentSize = parseFloat(localStorage.getItem('fontSize')) || 1.0;

let visibleCount = 25; 
const PAGE_SIZE = 25;

const mediaLogos = {
    "NHK": "https://www3.nhk.or.jp/favicon.ico",
    "Yahoo": "https://s.yimg.jp/c/icon/s/bsc/2.0/favicon.ico",
    "共同": "https://www.kyodo.co.jp/favicon.ico",
    "共同通信": "https://www.kyodo.co.jp/favicon.ico",
    "朝日": "https://www.asahi.com/favicon.ico",
    "読売": "https://www.yomiuri.co.jp/favicon.ico",
    "每日": "https://mainichi.jp/favicon.ico",
    "毎日": "https://mainichi.jp/favicon.ico",
    "日経": "https://www.nikkei.com/favicon.ico",
    "产经": "https://www.sankei.com/favicon.ico",
    "産経": "https://www.sankei.com/favicon.ico",
    "时事": "https://www.jiji.com/favicon.ico",
    "TBS": "https://news.tbs.co.jp/favicon.ico",
    "FNN": "https://www.fnn.jp/favicon.ico",
    "Bloomberg": "https://assets.bloomberg.com/static/images/favicon.ico",
    "CNN": "https://cnn.co.jp/favicon.ico",
    "Reuters": "https://www.reuters.com/favicon.ico",
    "路透": "https://www.reuters.com/favicon.ico",
    "BBC": "https://www.bbc.com/favicon.ico",
    "Record China": "https://d36u79445858l5.cloudfront.net/static/img/favicon.ico",
    "東洋経済": "https://toyokeizai.net/favicon.ico",
    "JBpress": "https://jbpress.ismedia.jp/favicon.ico"
};

const categoryMap = {
    '时政': 'politics', '政治': 'politics',
    '经济': 'economy',
    '社会': 'society',
    '军事': 'military',
    '科技': 'tech', 'IT': 'tech',
    '体育': 'sports', 
    '其他': 'other'
};

const translations = {
    sc: {
        siteTitle: '从日本看中国',
        latestNews: '100条日媒最新发布的中国新闻',
        searchPlaceholder: '搜索...',
        categories: { all: '全部', politics: '时政', economy: '经济', society: '社会', military: '军事', tech: '科技', sports: '体育', other: '其他' },
        archiveHeader: '📅 历史存档',
        aboutTitle: '关于本站',
        favTitle: '我的收藏',
        settingsTitle: '设置',
        noNews: '暂无相关新闻',
        noFav: '暂无收藏',
        dayNames: ['日', '一', '二', '三', '四', '五', '六'],
        today: '本日',
        archiveBtn: '历史',
        // 修复 undefined，直接使用固定词汇
        langLabel: '简繁切换', 
        themeLabel: '明暗切换',
        aboutContent: [
            'こんにちは、大家好。本网站专注聚合日本媒体发布的中国相关新闻，尽力消除信息差。',
            '网站会每小时自动抓取一次日本谷歌新闻中包含“中国”关键字的实时数据。首页展示最近 100 条记录，超出后自动存档。',
            '本站全程由 Gemini + Antigravity 制作。由于版权问题，标题使用机翻，日文正文请自行点击跳转阅读。',
            '本站零成本运营，如果你希望增加更多功能，欢迎打赏支持。'
        ]
    },
    tc: {
        siteTitle: '從日本看中國',
        latestNews: '100條日媒最新發布的中國新聞',
        searchPlaceholder: '搜尋...',
        categories: { all: '全部', politics: '時政', economy: '經濟', society: '社會', military: '軍事', tech: '科技', sports: '體育', other: '其他' },
        archiveHeader: '📅 歷史存檔',
        aboutTitle: '關於本站',
        favTitle: '我的收藏',
        settingsTitle: '設定',
        noNews: '暫無相關新聞',
        noFav: '暫無收藏',
        dayNames: ['日', '一', '二', '三', '四', '五', '六'],
        today: '本日',
        archiveBtn: '歷史',
        langLabel: '簡繁切換',
        themeLabel: '明暗切換',
        aboutContent: [
            'こんにちは、大家好。本網站專注聚合日本媒體發布的中國相關新聞，盡力消除信息差。',
            '網站會每小時自動抓取一次日本谷歌新聞中包含“中國”關鍵字的實時數據。首頁展示最近 100 條記錄，超出後自動存檔。',
            '本站全程由 Gemini + Antigravity 製作。由於版權問題，標題使用機翻，日文正文請自行點擊跳轉閱讀。',
            '本站零成本運營，如果你希望增加更多功能，歡迎打賞支持。'
        ]
    }
};

function init() {
    if (/MicroMessenger/i.test(navigator.userAgent)) {
        const mask = document.getElementById('wx-mask');
        if(mask) mask.style.display = 'block';
    }
    checkPWA();
    applySettings(); // Apply all saved settings (font, size, theme)
    renderCategoryNav();
    updateFavBadge();

    fetch('data.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
            if (data && data.news) {
                rawNewsData = data.news;
                lastUpdated = data.last_updated || '';
                if (lastUpdated) {
                    const formattedTime = lastUpdated.replace(/(\d+)年(\d+)月(\d+)日\s+(\d+)时(\d+)分/, '$1/$2/$3 $4:$5');
                    const timeEl = document.getElementById('last-update-time');
                    if(timeEl) timeEl.innerText = '数据更新于：' + timeAgo(formattedTime);
                }
            } else if (Array.isArray(data)) {
                rawNewsData = data;
            } else {
                rawNewsData = [];
            }
            prepareArchiveData(); 
            processAndRender();
        })
        .catch(e => {
            console.error(e);
            document.getElementById('news-list').innerHTML = '<div style="text-align:center;padding:20px;color:#f66;">加载失败</div>';
        });

    const installClose = document.getElementById('install-close');
    if(installClose) installClose.onclick = () => document.getElementById('install-banner').style.display = 'none';

    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 60) {
            header.classList.add('header-hidden');
        } else if (scrollTop < lastScrollTop) {
            header.classList.remove('header-hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
            loadMore();
        }
    }, { passive: true });
}

function loadMore() {
    if (visibleCount < 100) {
        visibleCount += PAGE_SIZE;
        processAndRender();
    }
}

function prepareArchiveData() {
    archiveData = {};
    rawNewsData.forEach(item => {
        if(item.timestamp) {
            const d = new Date(item.timestamp * 1000);
            if(!isNaN(d.getTime())) {
                const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                if(!archiveData[dateStr]) archiveData[dateStr] = [];
                archiveData[dateStr].push(item);
            }
        }
    });
}

// Generate the 8-block grid HTML (1 line, 8 items)
function getArchiveGridHtml() {
    const today = new Date();
    const t = translations[currentLang];
    
    // Start Container
    let html = `
        <div class="inline-archive-container">
            <div class="calendar-week">
                <div class="calendar-day archive-btn-block" onclick="showFullCalendar()">
                    <span class="day-name">${t.archiveBtn}</span>
                    <span class="day-number">📅</span>
                </div>`;

    // Loop 7 days
    for(let i=0; i<7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const count = archiveData[dateStr] ? archiveData[dateStr].length : 0;
        const isToday = i===0;
        const dayName = isToday ? translations[currentLang].today : translations[currentLang].dayNames[d.getDay()];
        
        html += `<div class="calendar-day ${count===0?'disabled':''} ${isToday?'calendar-day-today':''}" onclick="showArchiveModal('${dateStr}')">
            <span class="day-name">${dayName}</span><span class="day-number">${d.getDate()}</span><span class="day-count" style="font-size:8px;color:#999;">${count}</span>
        </div>`;
    }
    // End Container
    html += `</div></div>`;
    return html;
}

function renderCategoryNav() {
    const navContainer = document.getElementById('category-scroll');
    if(!navContainer) return;
    const t = translations[currentLang].categories;
    const cats = ['all', 'politics', 'economy', 'society', 'military', 'tech', 'sports', 'other'];
    
    let html = '';
    cats.forEach(catKey => {
        let displaySearchKey = 'all';
        if (catKey !== 'all') {
             displaySearchKey = Object.keys(categoryMap).find(key => categoryMap[key] === catKey) || '其他';
        }
        const isActive = (currentFilter === displaySearchKey);
        const activeClass = isActive ? 'active' : '';
        const label = t[catKey] || t['other'];
        
        let colorClass = 'tag-cat-all';
        if (catKey !== 'all') colorClass = 'tag-cat-' + catKey;

        html += `<div class="cat-pill ${activeClass} ${colorClass}" onclick="filterByCategory('${displaySearchKey}')">${label}</div>`;
    });
    navContainer.innerHTML = html;
}

function filterByCategory(cat) {
    currentFilter = cat;
    visibleCount = PAGE_SIZE; 
    renderCategoryNav();
    processAndRender();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSearch(val) {
    searchQuery = (val || '').toLowerCase().trim();
    visibleCount = PAGE_SIZE; 
    processAndRender();
}

function processAndRender() {
    const container = document.getElementById('news-list');
    const t = translations[currentLang];

    if (!rawNewsData || rawNewsData.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:30px;color:#ccc;">${t.noNews}</div>`;
        return;
    }

    let filtered = rawNewsData;
    if (currentFilter !== 'all') {
        filtered = rawNewsData.filter(i => (i.category || '其他') === currentFilter);
    }
    if (searchQuery) {
        filtered = filtered.filter(item => {
            const title = (item.title || '').toLowerCase();
            const origin = (item.origin || '').toLowerCase();
            return title.includes(searchQuery) || origin.includes(searchQuery);
        });
    }

    let sorted = [...filtered];
    sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const displayList = sorted.slice(0, visibleCount);
    let html = '';

    displayList.forEach((item, index) => {
        html += createCardHtml(item);
        if (index === 24) {
            html += getArchiveGridHtml();
        }
    });

    if (displayList.length < 25 && displayList.length > 0) {
        html += getArchiveGridHtml();
    }
    
    if (html === '') {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#ccc;">${t.noNews}</div>`;
    } else {
        container.innerHTML = html;
    }
    
    const listTitle = document.getElementById('list-title');
    if(listTitle) {
        if (searchQuery) listTitle.innerText = `"${searchQuery}"`;
        else if (currentFilter !== 'all') listTitle.innerText = translations[currentLang].categories[categoryMap[currentFilter]] || currentFilter;
        else listTitle.innerText = t.latestNews;
    }
}

function createCardHtml(item) {
    if (!item) return '';
    const isFav = favorites.some(f => f.link === item.link);
    const favClass = isFav ? 'active' : '';
    const itemStr = encodeURIComponent(JSON.stringify(item));
    
    const titleJaHtml = item.title_ja ? `<div class="card-title-ja"><a href="${item.link}" target="_blank">🇯🇵 ${item.title_ja}</a></div>` : '';
    const displayTitle = (currentLang === 'tc' && item.title_tc) ? item.title_tc : item.title;

    const cat = item.category || '其他';
    const catSuffix = categoryMap[cat] || 'other';
    const tagClass = `tag-cat-${catSuffix}`;

    let imageUrl = '';
    let hasImageClass = '';
    let isLogo = false;

    if (item.img && item.img.length > 0) {
        imageUrl = item.img;
        hasImageClass = 'has-image';
    } else if (item.origin) {
        const key = Object.keys(mediaLogos).find(k => item.origin.includes(k));
        if (key) {
            imageUrl = mediaLogos[key];
            hasImageClass = 'has-image';
            isLogo = true;
        }
    }
    const imgTag = imageUrl ? `<img src="${imageUrl}" loading="lazy" class="${isLogo ? 'is-logo' : ''}" onerror="this.parentElement.style.display='none'">` : '';

    return `
            <div class="card">
                <div class="card-body">
                    <div class="card-content-left">
                        <div class="card-meta-left">
                            <div class="card-fav-icon ${favClass}" onclick="toggleFavorite(event, '${itemStr}')">
                                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            </div>
                            <span class="tag ${tagClass}" onclick="filterByCategory('${cat}')">${cat}</span>
                            <span class="tag tag-time">${item.time_str || ''}</span>
                        </div>
                        <div class="card-title">${displayTitle || 'No Title'}</div>
                        ${titleJaHtml}
                    </div>
                    <div class="card-content-right">
                        <div class="card-origin-text">${item.origin || ''}</div>
                        <div class="card-image-right ${hasImageClass}">
                            ${imgTag}
                        </div>
                    </div>
                </div>
            </div>
            `;
}

function applySettings() {
    updateUIText();
    // Theme
    if (currentTheme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    updateBtnState('theme', currentTheme);

    // Lang
    updateBtnState('lang', currentLang);

    // Font Family
    const serifStack = "'Noto Serif SC', 'Noto Serif TC', 'Noto Serif JP', serif";
    const sansStack = "'Noto Sans SC', sans-serif";
    document.documentElement.style.setProperty('--font-family-main', currentFont === 'serif' ? serifStack : sansStack);
    updateBtnState('font', currentFont);

    // Font Size
    document.documentElement.style.setProperty('--font-scale', currentSize);
    document.querySelectorAll('[id^="size-"]').forEach(b => b.classList.remove('active'));
    if(currentSize < 1.0) document.getElementById('size-s').classList.add('active');
    else if(currentSize > 1.1) document.getElementById('size-l').classList.add('active');
    else document.getElementById('size-m').classList.add('active');
}

function updateBtnState(type, val) {
    document.querySelectorAll(`[id^="${type}-"]`).forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`${type}-${val}`);
    if(activeBtn) activeBtn.classList.add('active');
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    applySettings();
    renderCategoryNav();
    processAndRender();
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    applySettings();
}

function setFontFamily(font) {
    currentFont = font;
    localStorage.setItem('fontFamily', font);
    applySettings();
}

function setFontSize(size) {
    currentSize = size;
    localStorage.setItem('fontSize', size);
    applySettings();
}

function updateUIText() {
    const t = translations[currentLang];
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
    
    setText('site-title', t.siteTitle);
    setText('about-modal-title', t.aboutTitle);
    setText('fav-modal-title', t.favTitle);
    setText('settings-title', t.settingsTitle);
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.placeholder = t.searchPlaceholder;
    
    setText('label-lang', t.langLabel);
    setText('label-theme', t.themeLabel);

    const aboutBody = document.querySelector('#modal-about .modal-body');
    if(aboutBody) {
        let html = '';
        t.aboutContent.forEach(p => html += `<p style="margin-bottom:10px;font-size:14px;line-height:1.6;color:inherit;">${p}</p>`);
        html += `<div style="margin-top:20px;text-align:center;border-top:1px dashed rgba(0,0,0,0.1);padding-top:20px;"><img src="donate.jpg" style="width:180px;max-width:80%;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);" alt="Donate"></div>`;
        aboutBody.innerHTML = html;
    }
}

function timeAgo(dateString) {
    if(!dateString) return '';
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
        let pureTime = dateString.replace(/[^0-9\s:/]/g, '').trim();
        date = new Date(pureTime);
    }
    if (isNaN(date.getTime())) return dateString; 

    const now = new Date();
    let seconds = Math.floor((now - date) / 1000);
    if (seconds < 0) seconds = 0;
    const days = Math.floor(seconds / 86400);
    if (days >= 1) return days + "天前";
    const hours = Math.floor(seconds / 3600);
    if (hours >= 1) return hours + "小时" + Math.floor((seconds%3600)/60) + "分前";
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 1) return minutes + "分钟前";
    return "刚刚";
}

function toggleSection(sectionName) {
    const el = document.getElementById('modal-' + sectionName);
    if(el) {
        el.classList.add('show');
        if (sectionName === 'fav') renderFavorites();
    }
}
function closeModal(name) { 
    const el = document.getElementById('modal-' + name);
    if(el) el.classList.remove('show'); 
}

function toggleFavorite(e, itemStr) {
    e.stopPropagation();
    try {
        const item = JSON.parse(decodeURIComponent(itemStr));
        const index = favorites.findIndex(f => f.link === item.link);
        if (index > -1) favorites.splice(index, 1);
        else { 
            item.isRead = false; 
            favorites.unshift(item); 
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavBadge();
        processAndRender(); 
        const modalFav = document.getElementById('modal-fav');
        if (modalFav && modalFav.classList.contains('show')) renderFavorites();
    } catch(err) { console.error(err); }
}

function updateFavBadge() {
    const count = favorites.length;
    const badge = document.getElementById('fav-badge');
    if(badge) {
        if (count > 0) {
            badge.style.display = 'block';
            badge.innerText = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderFavorites() {
    const container = document.getElementById('fav-list-modal');
    if(!container) return;
    if (favorites.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:#ccc;padding:30px;">${translations[currentLang].noFav || '暂无收藏'}</div>`;
        return;
    }
    let html = '';
    favorites.forEach((item, index) => {
        const displayTitle = (currentLang === 'tc' && item.title_tc) ? item.title_tc : item.title;
        html += `<div class="list-item">
            <a href="${item.link}" target="_blank">${displayTitle}</a>
            <div class="list-item-meta">
                <span>${item.origin || ''} | ${item.time_str || ''}</span>
                <span class="btn-delete" onclick="deleteFav(${index})">删除</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function deleteFav(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavBadge();
    renderFavorites();
    processAndRender();
}

function clearAllFavorites() {
    if(confirm('确定要清空所有收藏吗？')) { 
        favorites=[]; 
        localStorage.setItem('favorites', '[]'); 
        updateFavBadge(); 
        renderFavorites(); 
        processAndRender(); 
    }
}

function showArchiveModal(dateStr) {
    const items = archiveData[dateStr] || [];
    const modalBody = document.getElementById('archive-modal-body');
    if(!modalBody) return;
    let html = '';
    items.forEach(item => {
        const displayTitle = (currentLang === 'tc' && item.title_tc) ? item.title_tc : item.title;
        html += `<div class="list-item">
            <a href="${item.link}" target="_blank">${displayTitle}</a>
            <div class="list-item-meta">
                <span>${item.origin || ''} | ${item.time_str || ''}</span>
            </div>
        </div>`;
    });
    modalBody.innerHTML = html;
    document.getElementById('modal-archive').classList.add('show');
}

function showFullCalendar() { 
    const todayStr = new Date().toISOString().split('T')[0];
    showArchiveModal(todayStr); 
}

function checkPWA() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const banner = document.getElementById('install-banner');
    if (!isStandalone && isIOS && banner) banner.style.display = 'flex';
}

init();
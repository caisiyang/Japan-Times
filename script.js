let rawNewsData = [];
let lastUpdated = '';
let favorites = JSON.parse(localStorage.getItem('jt_favorites') || '[]');
let currentFilter = 'all';
let archiveData = {}; // Store grouped archive data

function init() {
    if (/MicroMessenger/i.test(navigator.userAgent)) document.getElementById('wx-mask').style.display = 'block';
    checkPWA();

    fetch('data.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
            if (data.news && data.last_updated) {
                rawNewsData = data.news;
                lastUpdated = data.last_updated;

                // Display last updated time
                const lastUpdateEl = document.getElementById('last-update-time');
                if (lastUpdateEl) {
                    lastUpdateEl.textContent = `最新一次抓取数据时间：东京时间${lastUpdated}`;
                }
            } else {
                // Fallback for old format
                rawNewsData = Array.isArray(data) ? data : [];
            }
            processAndRender();
            updateFavBadge();
            renderCalendar(); // Render calendar after data load
        })
        .catch(e => {
            console.error('Failed to load news:', e);
            document.getElementById('news-list').innerHTML = '<div style="text-align:center;padding:20px;color:#f66;">加载失败，请刷新重试</div>';
        });

    document.getElementById('install-close').onclick = () => document.getElementById('install-banner').style.display = 'none';
}

function toggleSection(sectionName) {
    if (sectionName === 'about') {
        document.getElementById('modal-about').classList.add('show');
    } else if (sectionName === 'fav') {
        document.getElementById('modal-fav').classList.add('show');
        renderFavorites();
    }
}

function closeModal(modalName) {
    if (modalName === 'about') {
        document.getElementById('modal-about').classList.remove('show');
    } else if (modalName === 'fav') {
        document.getElementById('modal-fav').classList.remove('show');
    } else if (modalName === 'archive') {
        document.getElementById('modal-archive').classList.remove('show');
    }
}

function checkPWA() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone && isIOS) {
        document.getElementById('install-banner').style.display = 'flex';
        document.getElementById('install-text').innerText = "点击底部分享按钮，选择“添加到主屏幕” 📲";
    }
}

function filterByCategory(cat) {
    currentFilter = cat;
    const title = document.getElementById('list-title');
    const backBtn = document.getElementById('back-btn');

    if (cat === 'all') {
        title.innerText = 'Latest News';
        backBtn.style.display = 'none';
    } else {
        title.innerText = `${cat}`;
        backBtn.style.display = 'flex';
    }
    processAndRender();
}

function toggleFavorite(e, itemStr) {
    e.stopPropagation();
    const item = JSON.parse(decodeURIComponent(itemStr));
    const index = favorites.findIndex(f => f.link === item.link);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        // Add new favorite, mark as unread (isRead = false)
        item.isRead = false;
        favorites.unshift(item);
    }

    localStorage.setItem('jt_favorites', JSON.stringify(favorites));
    updateFavBadge();
    processAndRender(); // Re-render to update heart icon
    if (document.getElementById('modal-fav').classList.contains('show')) renderFavorites();
}

function updateFavBadge() {
    const btnText = document.getElementById('fav-btn-text');
    const count = favorites.length;

    if (count > 0) {
        btnText.innerHTML = `我的收藏（<span class="fav-count">${count}</span>）`;
    } else {
        btnText.textContent = '我的收藏';
    }
}

function renderFavorites() {
    const container = document.getElementById('fav-list-modal');
    if (favorites.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#ccc;padding:20px;">暂无收藏</div>';
        return;
    }

    let html = '<div style="margin-bottom: 16px; display: flex; gap: 8px; justify-content: flex-end;">';
    html += '<button onclick="selectAllFavorites()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600;">全选</button>';
    html += '<button onclick="deleteSelectedFavorites()" style="background: var(--accent-color); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600;">删除选中</button>';
    html += '<button onclick="clearAllFavorites()" style="background: #999; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600;">清空所有</button>';
    html += '</div>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';

    favorites.forEach((item, index) => {
        html += `<div style="padding: 12px; background: #f9f9f9; border-radius: 8px; border-left: 3px solid var(--accent-color); display: flex; align-items: center; gap: 10px;">`;
        html += `<input type="checkbox" class="fav-checkbox" data-index="${index}" style="width: 18px; height: 18px; cursor: pointer;">`;
        html += `<a href="${item.link}" target="_blank" style="color: var(--text-main); text-decoration: none; font-size: 14px; line-height: 1.6; flex: 1;" onclick="markFavAsRead(${index})">${item.title}</a>`;
        html += `</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

function selectAllFavorites() {
    const checkboxes = document.querySelectorAll('.fav-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

function deleteSelectedFavorites() {
    const checkboxes = document.querySelectorAll('.fav-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('请先选择要删除的收藏');
        return;
    }

    if (confirm(`确定要删除选中的 ${checkboxes.length} 条收藏吗？`)) {
        const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
        indicesToDelete.sort((a, b) => b - a); // Delete from end to start
        indicesToDelete.forEach(index => {
            favorites.splice(index, 1);
        });
        localStorage.setItem('jt_favorites', JSON.stringify(favorites));
        updateFavBadge();
        renderFavorites();
    }
}

function clearAllFavorites() {
    if (confirm('确定要清空所有收藏吗？')) {
        favorites = [];
        localStorage.setItem('jt_favorites', JSON.stringify(favorites));
        updateFavBadge();
        renderFavorites();
    }
}

function markFavAsRead(index) {
    if (favorites[index]) {
        favorites[index].isRead = true;
        localStorage.setItem('jt_favorites', JSON.stringify(favorites));
        updateFavBadge();
    }
}

function renderCalendar() {
    const weekContainer = document.getElementById('calendar-week');
    const archiveSection = document.getElementById('archive-section');

    // Group news by date (YYYY-MM-DD)
    archiveData = {};
    rawNewsData.forEach(item => {
        // Use time_str "MM-DD" to group, but we need full date. 
        // Assuming timestamp is available.
        if (item.timestamp) {
            const date = new Date(item.timestamp * 1000);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!archiveData[dateStr]) archiveData[dateStr] = [];
            archiveData[dateStr].push(item);
        }
    });

    // Generate last 7 days
    const today = new Date();
    let html = '';
    let hasArchive = false;

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
        const count = archiveData[dateStr] ? archiveData[dateStr].length : 0;

        if (count > 0) hasArchive = true;

        const isDisabled = count === 0 ? 'disabled' : '';
        const onClick = count > 0 ? `onclick="showArchiveModal('${dateStr}')"` : '';

        html += `
                    <div class="calendar-day ${isDisabled}" ${onClick}>
                        <span class="day-name">周${dayName}</span>
                        <span class="day-number">${d.getDate()}</span>
                        <span class="day-count">${count}</span>
                    </div>
                `;
    }

    weekContainer.innerHTML = html;

    // Show archive section if there is any data
    if (hasArchive) {
        archiveSection.style.display = 'block';
    }
}

function showArchiveModal(dateStr) {
    const items = archiveData[dateStr] || [];
    const modalBody = document.getElementById('archive-modal-body');
    const modalTitle = document.getElementById('archive-modal-title');

    modalTitle.textContent = `${dateStr} 存档 (${items.length}条)`;

    let html = '';
    items.forEach(item => {
        html += `<div style="padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">`;
        html += `<a href="${item.link}" target="_blank" style="color: var(--text-main); text-decoration: none; font-size: 14px; line-height: 1.6; display: block; font-weight: 500;">${item.title}</a>`;
        html += `<div style="font-size: 11px; color: var(--text-sub); margin-top: 4px; display:flex; justify-content:space-between;">`;
        html += `<span>${item.origin || 'Google News'}</span>`;
        html += `<span>${item.time_str}</span>`;
        html += `</div>`;
        html += `</div>`;
    });

    modalBody.innerHTML = html;
    document.getElementById('modal-archive').classList.add('show');
}

function processAndRender() {
    const container = document.getElementById('news-list');

    if (!rawNewsData || rawNewsData.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">暂无相关新闻</div>';
        return;
    }

    // 1. Filter
    let filtered = rawNewsData;
    if (currentFilter !== 'all') {
        filtered = rawNewsData.filter(i => (i.category || '其他') === currentFilter);
    }

    // 2. Sort by timestamp (always newest first)
    let sorted = [...filtered];
    sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // 3. Split by 100-item limit for Homepage
    const recent = sorted.slice(0, 100);

    // 4. Render Recent
    let html = '';
    recent.forEach((item) => {
        html += createCardHtml(item);
    });
    container.innerHTML = html || '<div style="text-align:center;padding:20px;color:#ccc;">暂无新闻</div>';
}

function createCardHtml(item) {
    const isFav = favorites.some(f => f.link === item.link);
    const favClass = isFav ? 'active' : '';
    const itemStr = encodeURIComponent(JSON.stringify(item));

    // Japanese title with link
    const titleJaHtml = item.title_ja ? `<div class="card-title-ja"><a href="${item.link}" target="_blank">🇯🇵 ${item.title_ja}</a></div>` : '';

    return `
            <div class="card" onclick="window.open('${item.link}', '_blank')">
                <div class="card-fav-btn ${favClass}" onclick="toggleFavorite(event, '${itemStr}')">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span class="tag tag-cat" onclick="event.stopPropagation(); filterByCategory('${item.category}')">${item.category}</span>
                        <span class="tag tag-time">${item.time_str}</span>
                        <span class="card-origin">${item.origin}</span>
                    </div>
                    <div class="card-title">${item.title}</div>
                    ${titleJaHtml}
                </div>
            </div>
            `;
}

// Init
init();

// dashboard.js — depends on api.js and utils.js loaded before this

let allIssues = [];   // stores every issue fetched on load
let activeTab = 'all';

const grid = document.getElementById('issues-grid');

/* ── Auth guard ─────────────────────────────────────── */
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

/* ══════════════════════════════════════════════════════
   RENDER CARDS
══════════════════════════════════════════════════════ */
function renderIssues(issues) {
  if (!issues || issues.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No issues found</h3>
        <p>Try a different search or tab.</p>
      </div>`;
    return;
  }

  grid.innerHTML = issues.map(issue => {
    // Store full issue as base64 JSON in data-attribute → no second API call needed
    const encoded   = btoa(unescape(encodeURIComponent(JSON.stringify(issue))));
    const status    = (issue.status || '').toLowerCase();
    const borderCls = status === 'open' ? 'border-open' : 'border-closed';
    const statusImg = status === 'open'
      ? `<img src="./assets/Open-Status.png" class="w-5 h-5" alt="open">`
      : `<img src="./assets/Closed-Status.png" class="w-5 h-5" alt="closed">`;
    const labelsHtml = issue.labels && issue.labels.length
      ? `<div class="flex flex-wrap gap-1 mt-2">${renderLabels(issue.labels)}</div>`
      : '';

    return `
      <div class="issue-card ${borderCls}" data-issue="${encoded}" onclick="openModal(this)">
        <div class="flex justify-between items-center">
          ${statusImg}
          <span class="priority-${(issue.priority || '').toLowerCase()}">
            ${(issue.priority || '').toUpperCase()}
          </span>
        </div>
        <h3 class="issue-title">${issue.title || 'Untitled'}</h3>
        <p class="issue-desc">${issue.description || ''}</p>
        ${labelsHtml}
        <div class="issue-footer">
          <span>#${issue.id} by ${issue.author || 'Unknown'}</span>
          <span>${formatDate(issue.createdAt)}</span>
        </div>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════ */
window.setTab = function(tab) {
  activeTab = tab;

  ['all', 'open', 'closed'].forEach(t =>
    document.getElementById(`tab-${t}`).classList.remove('active-tab')
  );
  document.getElementById(`tab-${tab}`).classList.add('active-tab');

  const filtered = tab === 'all'
    ? allIssues
    : allIssues.filter(i => (i.status || '').toLowerCase() === tab);

  const label = tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1);
  document.getElementById('total-count').textContent = `${filtered.length} ${label} Issues`;

  renderIssues(filtered);
};

/* ══════════════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════════════ */
window.handleSearch = async function() {
  const text = document.getElementById('search-input').value.trim();

  if (!text) {
    setTab(activeTab);
    return;
  }

  grid.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1"><div class="spinner"></div></div>`;
  document.getElementById('total-count').textContent = 'Searching...';

  try {
    const results = await searchIssues(text);
    document.getElementById('total-count').textContent =
      `${results.length} Result${results.length !== 1 ? 's' : ''} for "${text}"`;
    renderIssues(results);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Search failed</h3><p>Please try again.</p></div>`;
    document.getElementById('total-count').textContent = 'Search failed';
  }
};

document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});


window.openModal = function(cardEl) {
  const overlay = document.getElementById('modal-overlay');
  const loading = document.getElementById('modal-loading');
  const content = document.getElementById('modal-content');

  // Decode issue data stored on the card element
  let issue;
  try {
    issue = JSON.parse(decodeURIComponent(escape(atob(cardEl.dataset.issue))));
  } catch (e) {
    console.error('Failed to parse issue data', e);
    return;
  }

  // Show modal immediately — no spinner needed, data is already here
  loading.style.display = 'none';
  content.style.display = 'block';
  overlay.style.display = 'flex';

  const statusBadge = (issue.status || '').toLowerCase() === 'open'
    ? `<span class="status-open">Opened</span>`
    : `<span class="status-closed">Closed</span>`;

  const labelsHtml = (issue.labels || [])
    .map(l => `<span class="label-chip">${l}</span>`)
    .join('');

  content.innerHTML = `
    <h2 class="modal-title">${issue.title || 'Untitled'}</h2>

    <div class="modal-meta">
      ${statusBadge}
      <span>&bull; Opened by <strong>${issue.author || 'Unknown'}</strong>
      &bull; ${formatDate(issue.createdAt)}</span>
    </div>

    <div class="modal-labels">${labelsHtml}</div>

    <p class="modal-desc">${issue.description || 'No description provided.'}</p>

    <div class="modal-info">
      <div>
        <p class="modal-label">Assignee:</p>
        <p style="font-weight:600; margin-top:4px;">${issue.assignee || 'Unassigned'}</p>
      </div>
      <div>
        <p class="modal-label">Priority:</p>
        <span class="priority-${(issue.priority || 'low').toLowerCase()}"
          style="margin-top:4px; display:inline-block;">
          ${(issue.priority || 'None').toUpperCase()}
        </span>
      </div>
    </div>`;
};

/* ══════════════════════════════════════════════════════
   MODAL — close
══════════════════════════════════════════════════════ */
window.closeModal = function() {
  document.getElementById('modal-overlay').style.display = 'none';
};

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
async function init() {
  grid.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    allIssues = await getIssues();

    const openCount   = allIssues.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const closedCount = allIssues.filter(i => (i.status || '').toLowerCase() === 'closed').length;

    document.getElementById('open-count').textContent   = `${openCount} Open`;
    document.getElementById('closed-count').textContent = `${closedCount} Closed`;

    setTab('all');

  } catch (err) {
    console.error('init error:', err);
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load issues</h3>
        <p>Check your connection and refresh the page.</p>
      </div>`;
    document.getElementById('total-count').textContent = 'Error loading issues';
  }
}

init();
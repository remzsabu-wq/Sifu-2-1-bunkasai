const DEV_CODE = '202690201';
const STORAGE_KEY = 'festival-queue-display-state';
const WINDOW_SIZE = 6;

const defaultState = {
  rangeStart: 1,
  waitingNumbers: []
};

let state = loadState();

const visitorScreen = document.getElementById('visitor-screen');
const adminScreen = document.getElementById('admin-screen');
const callRangeNode = document.getElementById('call-range');
const waitingListNode = document.getElementById('waiting-list');
const adminWaitingListNode = document.getElementById('admin-waiting-list');
const adminRangeLabel = document.getElementById('admin-range-label');
const adminRangeInput = document.getElementById('admin-range-input');
const waitingNumberInput = document.getElementById('waiting-number-input');
const devCodeInput = document.getElementById('dev-code-input');
const adminPanel = document.getElementById('admin-panel');
const adminLockPanel = document.getElementById('admin-lock-panel');
const toastNode = document.getElementById('toast');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') {
      return { ...defaultState };
    }

    return {
      rangeStart: normalizeStart(saved.rangeStart),
      waitingNumbers: normalizeList(saved.waitingNumbers)
    };
  } catch (error) {
    return { ...defaultState };
  }
}

function normalizeStart(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0)
  )].sort((a, b) => a - b);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message, type = 'success') {
  toastNode.textContent = message;
  toastNode.className = `toast show ${type}`;

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastNode.className = 'toast';
  }, 2200);
}

function setScreen(screenName) {
  visitorScreen.classList.toggle('active', screenName === 'visitor');
  adminScreen.classList.toggle('active', screenName === 'admin');
}

function renderRangeDisplay() {
  const rangeNumbers = Array.from({ length: WINDOW_SIZE }, (_, index) => state.rangeStart + index);
  callRangeNode.innerHTML = rangeNumbers
    .map((number) => `<div class="queue-number">${number}</div>`)
    .join('');

  if (adminRangeLabel) {
    adminRangeLabel.textContent = `${state.rangeStart}~${state.rangeStart + WINDOW_SIZE - 1}`;
  }

  if (adminRangeInput) {
    adminRangeInput.value = state.rangeStart;
  }
}

function renderWaitingList() {
  const items = state.waitingNumbers;

  const renderTemplate = (target) => {
    if (!items.length) {
      target.innerHTML = '<div class="placeholder">待ち番号はありません</div>';
      return;
    }

    target.innerHTML = items
      .map((number) => `<span class="waiting-chip">${number}</span>`)
      .join('');
  };

  renderTemplate(waitingListNode);
  renderTemplate(adminWaitingListNode);
}

function syncStateFromStorage() {
  state = loadState();
  renderAll();
}

function renderAll() {
  renderRangeDisplay();
  renderWaitingList();
  saveState();
}

function addOrToggleWaitingNumber(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    showToast('1以上の番号を入力してください', 'error');
    return;
  }

  if (state.waitingNumbers.includes(parsed)) {
    removeWaitingNumber(parsed);
    return;
  }

  state.waitingNumbers = normalizeList([...state.waitingNumbers, parsed]);
  renderAll();
  waitingNumberInput.value = '';
  showToast(`番号 ${parsed} を追加しました`);
}

function removeWaitingNumber(value) {
  state.waitingNumbers = state.waitingNumbers.filter((item) => item !== value);
  renderAll();
  waitingNumberInput.value = '';
  showToast(`番号 ${value} を削除しました`);
}

function setRangeStart(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    showToast('開始番号は1以上で入力してください', 'error');
    return;
  }

  state.rangeStart = parsed;
  renderAll();
}

function unlockAdmin() {
  const code = devCodeInput.value.trim();
  if (code !== DEV_CODE) {
    showToast('パスワードが違います', 'error');
    return;
  }

  adminPanel.classList.remove('hidden');
  adminLockPanel.classList.add('hidden');
  setScreen('admin');
  showToast('管理画面を開きました');
}

function openDeveloperUnlock() {
  setScreen('admin');
  adminLockPanel.classList.remove('hidden');
  adminPanel.classList.add('hidden');
  devCodeInput.focus();
}

document.getElementById('dev-trigger').addEventListener('click', openDeveloperUnlock);
document.getElementById('unlock-admin-btn').addEventListener('click', unlockAdmin);
document.getElementById('move-left-btn').addEventListener('click', () => {
  state.rangeStart = Math.max(1, state.rangeStart - 1);
  renderAll();
});
document.getElementById('move-right-btn').addEventListener('click', () => {
  state.rangeStart = state.rangeStart + 1;
  renderAll();
});
document.getElementById('admin-range-input').addEventListener('change', (event) => {
  setRangeStart(event.target.value);
});
document.getElementById('add-waiting-btn').addEventListener('click', () => {
  addOrToggleWaitingNumber(waitingNumberInput.value);
});
document.getElementById('waiting-number-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addOrToggleWaitingNumber(waitingNumberInput.value);
  }
});
document.getElementById('dev-code-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    unlockAdmin();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    syncStateFromStorage();
  }
});

renderAll();
setScreen('visitor');

window.setInterval(() => {
  window.location.reload();
}, 60000);

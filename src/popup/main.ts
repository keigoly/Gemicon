// 設定キー
const STORAGE_KEY = 'isEnabled';

const toggleSwitch = document.getElementById('toggle-switch') as HTMLInputElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;

/**
 * UIの表示を更新する
 */
const updateUI = (isEnabled: boolean) => {
  toggleSwitch.checked = isEnabled;
  statusText.textContent = isEnabled ? 'Status: ON' : 'Status: OFF';
  statusText.style.color = isEnabled ? '#1a73e8' : '#666';
};

/**
 * 初期化処理: 保存された設定を読み込む
 */
const init = async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  // デフォルトは true
  const isEnabled = data[STORAGE_KEY] ?? true;
  updateUI(isEnabled);
};

/**
 * スイッチ切り替え時のイベントハンドラ
 */
toggleSwitch.addEventListener('change', async (e) => {
  const isEnabled = (e.target as HTMLInputElement).checked;
  
  // 1. 設定を保存
  await chrome.storage.local.set({ [STORAGE_KEY]: isEnabled });
  updateUI(isEnabled);

  // 2. 現在開いているGeminiタブがあればリロードして設定を反映
  const tabs = await chrome.tabs.query({ url: '*://gemini.google.com/*' });
  tabs.forEach(tab => {
    if (tab.id) {
      chrome.tabs.reload(tab.id);
    }
  });
});

// 実行
init();
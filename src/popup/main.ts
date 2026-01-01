// src/popup/main.ts

const KEY_ENABLED = 'isEnabled';
const KEY_SETTINGS = 'gemSettings';
const KEY_LANG = 'appLanguage';

interface GemSetting {
  name: string;
  image: string;
}

// ▼▼▼ 翻訳データ (ボタン文言を追加) ▼▼▼
const translations: Record<string, Record<string, string>> = {
  en: {
    appName: 'GemAvatar',
    statusOn: 'Status: ON',
    statusOff: 'Status: OFF',
    labelTarget: '1. Target Gem Name:',
    placeholderTarget: 'Please enter the target Gem name here.',
    labelImage: '2. Select Icon Image:',
    btnAdd: 'Add Gem Settings',
    labelList: 'Registered Gems:',
    settingsTitle: 'Settings',
    langLabel: 'Language',
    // 追加
    btnChooseFile: 'Choose File',
    noFileChosen: 'No file chosen'
  },
  ja: {
    appName: 'GemAvatar',
    statusOn: '状態: ON',
    statusOff: '状態: OFF',
    labelTarget: '1. 対象のGem名:',
    placeholderTarget: '対象のワードを入力してください',
    labelImage: '2. アイコン画像を選択:',
    btnAdd: '設定を追加',
    labelList: '登録済み:',
    settingsTitle: '設定',
    langLabel: '言語設定',
    // 追加
    btnChooseFile: 'ファイルを選択',
    noFileChosen: '選択されていません'
  }
};

// DOM要素の取得
const viewMain = document.getElementById('view-main') as HTMLElement;
const viewSettings = document.getElementById('view-settings') as HTMLElement;
const btnOpenSettings = document.getElementById('btn-open-settings') as HTMLButtonElement;
const btnBack = document.getElementById('btn-back') as HTMLButtonElement;

const toggleSwitch = document.getElementById('toggle-switch') as HTMLInputElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;
const nameInput = document.getElementById('gem-name-input') as HTMLInputElement;
const imageInput = document.getElementById('gem-image-input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const gemList = document.getElementById('gem-list') as HTMLUListElement;

// 追加: ファイル名表示用の要素
const fileNameDisplay = document.getElementById('file-name-display') as HTMLSpanElement;

const langRadios = document.querySelectorAll('input[name="lang"]');
let currentLang = 'en';

// --- 言語・翻訳処理 ---

const updateTexts = () => {
  const t = translations[currentLang];
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    // ファイル名が表示されている時は、翻訳で上書きしないようにする
    if (el.id === 'file-name-display' && !el.hasAttribute('data-i18n')) return;

    const key = el.getAttribute('data-i18n');
    if (key && t[key]) {
      el.textContent = t[key];
    }
  });

  if (t.placeholderTarget) {
    nameInput.placeholder = t.placeholderTarget;
  }
  updateStatusText(toggleSwitch.checked);
};

const updateStatusText = (isEnabled: boolean) => {
  const t = translations[currentLang];
  statusText.textContent = isEnabled ? t.statusOn : t.statusOff;
  statusText.style.color = isEnabled ? '#1a73e8' : '#5f6368';
};

// --- ファイル入力の表示制御 ---
imageInput.addEventListener('change', () => {
  if (imageInput.files && imageInput.files.length > 0) {
    // ファイルが選ばれたら、その名前を表示し、翻訳対象から外す
    fileNameDisplay.textContent = imageInput.files[0].name;
    fileNameDisplay.removeAttribute('data-i18n');
    checkInputState();
  } else {
    // キャンセルされたら、デフォルト文言に戻す
    resetFileInputDisplay();
    checkInputState();
  }
});

const resetFileInputDisplay = () => {
  imageInput.value = ''; // 実際のinputをクリア
  fileNameDisplay.setAttribute('data-i18n', 'noFileChosen');
  fileNameDisplay.textContent = translations[currentLang].noFileChosen;
};

// --- 画面遷移 ---
btnOpenSettings.addEventListener('click', () => {
  viewMain.classList.add('hidden');
  viewSettings.classList.remove('hidden');
});
btnBack.addEventListener('click', () => {
  viewSettings.classList.add('hidden');
  viewMain.classList.remove('hidden');
});

// --- 言語切り替え ---
langRadios.forEach(radio => {
  radio.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      currentLang = target.value;
      await chrome.storage.local.set({ [KEY_LANG]: currentLang });
      updateTexts();
    }
  });
});

// --- ロジック ---
const renderGemList = (settings: GemSetting[]) => {
  gemList.innerHTML = '';
  settings.forEach(setting => {
    const li = document.createElement('li');
    li.className = 'gem-item';
    const img = document.createElement('img');
    img.src = setting.image;
    const span = document.createElement('span');
    span.className = 'item-name';
    span.textContent = setting.name;
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => removeGem(setting.name);

    li.appendChild(img);
    li.appendChild(span);
    li.appendChild(delBtn);
    gemList.appendChild(li);
  });
};

const checkInputState = () => {
  addBtn.disabled = !(nameInput.value.trim() && imageInput.files && imageInput.files.length > 0);
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const reloadTabs = async () => {
  const tabs = await chrome.tabs.query({ url: '*://gemini.google.com/*' });
  tabs.forEach(tab => {
    if (tab.id) chrome.tabs.reload(tab.id);
  });
};

const addGem = async () => {
  const name = nameInput.value.trim();
  const file = imageInput.files ? imageInput.files[0] : null;

  if (!name || !file) return;

  try {
    const base64Image = await convertFileToBase64(file);
    const data = await chrome.storage.local.get(KEY_SETTINGS);
    const currentSettings: GemSetting[] = data[KEY_SETTINGS] ?? [];

    const newSettings = currentSettings.filter(s => s.name !== name);
    newSettings.push({ name: name, image: base64Image });

    await chrome.storage.local.set({ [KEY_SETTINGS]: newSettings });
    renderGemList(newSettings);
    reloadTabs();

    // 入力リセット
    nameInput.value = '';
    resetFileInputDisplay();
    checkInputState();

  } catch (e) {
    console.error(e);
    alert("Error loading image.");
  }
};

const removeGem = async (nameToRemove: string) => {
  const data = await chrome.storage.local.get(KEY_SETTINGS);
  const currentSettings: GemSetting[] = data[KEY_SETTINGS] ?? [];
  const newSettings = currentSettings.filter(s => s.name !== nameToRemove);
  await chrome.storage.local.set({ [KEY_SETTINGS]: newSettings });
  renderGemList(newSettings);
  reloadTabs();
};

const init = async () => {
  const data = await chrome.storage.local.get([KEY_ENABLED, KEY_SETTINGS, KEY_LANG]);
  
  if (data[KEY_LANG]) {
    currentLang = data[KEY_LANG];
  } else {
    const browserLang = navigator.language;
    if (browserLang.startsWith('ja')) {
      currentLang = 'ja';
    }
  }

  const radioToSelect = document.querySelector(`input[name="lang"][value="${currentLang}"]`) as HTMLInputElement;
  if (radioToSelect) radioToSelect.checked = true;

  updateTexts();
  
  toggleSwitch.checked = data[KEY_ENABLED] ?? true;
  updateStatusText(toggleSwitch.checked);
  renderGemList(data[KEY_SETTINGS] ?? []);
};

toggleSwitch.addEventListener('change', async (e) => {
  const isEnabled = (e.target as HTMLInputElement).checked;
  await chrome.storage.local.set({ [KEY_ENABLED]: isEnabled });
  updateStatusText(isEnabled);
  reloadTabs();
});

addBtn.addEventListener('click', addGem);
nameInput.addEventListener('input', checkInputState);
// changeイベントは上で定義済みなのでここでは不要

init();
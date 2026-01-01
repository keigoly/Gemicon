// src/content/index.ts

interface GemSetting {
  name: string;
  image: string;
}

let gemSettings: GemSetting[] = [];
const PROCESSED_ATTR = 'data-gemavatar-processed';

const getImageUrl = (path: string) => {
  try {
    return chrome.runtime.getURL(path);
  } catch (e) {
    return '';
  }
};

const cleanupOldMess = (targetElement: HTMLElement) => {
  const oldImages = targetElement.querySelectorAll('img[src*="chrome-extension"]');
  oldImages.forEach(img => img.remove());
  if (targetElement.style.display === 'none') {
    targetElement.style.display = '';
  }
};

const applyAvatarStyle = (element: HTMLElement, imageOrPath: string) => {
  cleanupOldMess(element);
  const bgUrl = imageOrPath.startsWith('data:') ? imageOrPath : getImageUrl(imageOrPath);

  element.style.color = 'transparent';
  element.style.backgroundColor = 'transparent';
  element.style.boxShadow = 'none';
  element.style.border = 'none';
  
  element.style.backgroundImage = `url("${bgUrl}")`;
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  element.style.backgroundRepeat = 'no-repeat';
  element.style.borderRadius = '50%';
  
  element.style.minWidth = '28px';
  element.style.minHeight = '28px';
  element.style.display = 'inline-block';

  element.setAttribute(PROCESSED_ATTR, 'true');
};

const performReplacement = () => {
  if (gemSettings.length === 0) return;

  // 1. 現在のページタイトル（一番上の大きな文字）を取得
  // これが「新規 アプリ開発」なら、下にある「最近」リストもそのGemのものだと判断できる
  const pageTitleElement = document.querySelector('h1, .gds-headline, [role="heading"]');
  const pageTitle = pageTitleElement ? pageTitleElement.textContent?.trim() : '';

  const candidates = document.querySelectorAll('.bot-logo-text');

  candidates.forEach(candidate => {
    const el = candidate as HTMLElement;
    
    // 処理済みチェック（ゴミ掃除含む）
    if (el.getAttribute(PROCESSED_ATTR) === 'true') {
        const hasGarbage = el.querySelector('img[src*="chrome-extension"]');
        if (!hasGarbage) return;
    }

    const iconText = el.textContent?.trim();
    if (!iconText) return;

    // 頭文字が一致するGem設定を探す
    const targetGem = gemSettings.find(setting => setting.name.charAt(0) === iconText);
    if (!targetGem) return;

    // --- ロジック開始 ---

    // A. サイドバー内かどうか？
    const isInSidebar = el.closest('mat-sidenav, nav, [role="navigation"], .sidenav-container');
    
    // B. 「最近のチャット」リスト内かどうか？ (いただいたHTMLのクラス名を使用)
    const isInRecentList = el.closest('.bot-recent-chats, .bot-recent-chats-container');

    // C. 近くに名前があるか探す（従来の方法）
    let nameFoundNearby = false;
    let parent = el.parentElement;
    for (let i = 0; i < 7; i++) {
      if (!parent) break;
      if (parent.querySelectorAll('.bot-logo-text').length > 2) break; // 誤爆防止

      if (parent.textContent && parent.textContent.includes(targetGem.name)) {
        const textWithoutIcon = parent.textContent.replace(iconText, '');
        if (textWithoutIcon.includes(targetGem.name)) {
            nameFoundNearby = true;
            break;
        }
      }
      parent = parent.parentElement;
    }

    // --- 適用判定 ---

    if (nameFoundNearby) {
      // 1. 名前が横にある（サイドバーやヘッダー） -> 確実なので適用
      applyAvatarStyle(el, targetGem.image);
    } 
    else if (isInRecentList) {
      // 2. 「最近」リストの中にある場合
      // 名前は横にないが、ページのタイトルがGem名と一致していれば適用
      if (pageTitle && pageTitle.includes(targetGem.name)) {
        applyAvatarStyle(el, targetGem.image);
      }
    }
    else if (!isInSidebar) {
      // 3. その他の場所（チャット画面のヘッダーなど）で、名前が見つからなかった場合
      // これもページタイトルと一致していれば適用の余地あり
      if (pageTitle && pageTitle.includes(targetGem.name)) {
         applyAvatarStyle(el, targetGem.image);
      }
    }
  });
};

const startEngine = async () => {
  const data = await chrome.storage.local.get(['isEnabled', 'gemSettings']);
  const isEnabled = data.isEnabled ?? true;
  gemSettings = data.gemSettings ?? [];

  if (!isEnabled) {
    console.log('[GemAvatar] Disabled by user setting.');
    return;
  }

  console.log('[GemAvatar] Context-Aware Engine v2 Started.');
  performReplacement();

  const observer = new MutationObserver(() => {
    performReplacement();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(performReplacement, 1000);
};

startEngine();
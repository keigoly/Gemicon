// src/content/index.ts

// ▼▼▼ 設定エリア ▼▼▼
const TARGET_GEMS = [
  { 
    name: "新規 アプリ開発",
    image: "src/assets/my-avatar.png"
  },
  { 
    name: "継続 アプリ開発",
    image: "src/assets/my-avatar.png"
  }
];
// ▲▲▲ 設定エリア終了 ▲▲▲

const PROCESSED_ATTR = 'data-gemavatar-processed';

const getImageUrl = (path: string) => {
  try {
    return chrome.runtime.getURL(path);
  } catch (e) {
    return '';
  }
};

/**
 * 【自己修復機能】
 * 以前のバージョンのスクリプトによって壊れたレイアウトや、
 * 挿入されてしまった不要なimgタグを検知して削除・修復する
 */
const cleanupOldMess = (targetElement: HTMLElement) => {
  // 1. もしこの要素の中に、拡張機能が追加したimgタグがあれば削除する
  const oldImages = targetElement.querySelectorAll('img[src*="chrome-extension"]');
  oldImages.forEach(img => {
    console.log('[GemAvatar] Removing old garbage image:', img);
    img.remove();
  });

  // 2. もしこの要素自体が非表示(display: none)にされていたら、見えるように戻す
  if (targetElement.style.display === 'none') {
    targetElement.style.display = '';
  }
};

/**
 * アイコンのスタイルを安全に書き換える（背景画像方式）
 */
const applyAvatarStyle = (element: HTMLElement, imagePath: string) => {
  // まずはお掃除
  cleanupOldMess(element);

  // 1. 中の文字（"新"）を透明にする
  element.style.color = 'transparent';

  // 2. 背景色を透明にする
  element.style.backgroundColor = 'transparent';
  element.style.boxShadow = 'none';
  element.style.border = 'none';
  
  // 3. 背景画像としてあなたのアイコンを設定
  element.style.backgroundImage = `url("${getImageUrl(imagePath)}")`;
  element.style.backgroundSize = 'cover';      // 枠いっぱいに広げる
  element.style.backgroundPosition = 'center'; // 真ん中に合わせる
  element.style.backgroundRepeat = 'no-repeat';

  // 4. 丸くする
  element.style.borderRadius = '50%';
  
  // 5. 重要: サイズが潰れないように明示的に指定（元のCSSを引き継ぐが念のため）
  element.style.minWidth = '28px';
  element.style.minHeight = '28px';
  element.style.display = 'flex'; // フレックスボックスにして配置を安定させる

  // 6. 処理済みフラグを立てる
  element.setAttribute(PROCESSED_ATTR, 'true');
};

/**
 * メイン処理
 */
const performReplacement = () => {
  // 設定にあるGemの名前を1つずつ探す
  TARGET_GEMS.forEach(config => {
    // スクリーンショットから判明した構造:
    // 行全体の中から、ターゲットの名前を含むものを探す
    // Geminiのリスト行は aタグ、divタグなどで構成される
    const allRows = document.querySelectorAll('a, div[role="listitem"], .bot-list-row-container');

    allRows.forEach(row => {
      // その行にターゲットの名前が含まれているか？
      if (!row.textContent || !row.textContent.includes(config.name)) {
        return;
      }

      // その行の中にある「アイコン（bot-logo-text）」を探す
      // ★検証画面で特定した正解のクラス名
      const iconElement = row.querySelector('.bot-logo-text') as HTMLElement;

      if (iconElement) {
        // まだ処理していない、または古いバージョンのゴミが残っている場合は処理を実行
        const isProcessed = iconElement.getAttribute(PROCESSED_ATTR) === 'true';
        const hasGarbage = iconElement.querySelector('img[src*="chrome-extension"]');
        
        if (!isProcessed || hasGarbage) {
           console.log(`[GemAvatar] Replacing icon for: ${config.name}`);
           applyAvatarStyle(iconElement, config.image);
        }
      }
    });
  });
};

/**
 * エンジン起動
 */
const startEngine = () => {
  console.log('[GemAvatar] Self-Healing Engine Started.');
  
  // 初回実行
  performReplacement();

  // 監視実行（画面遷移や動的な書き換えに対応）
  const observer = new MutationObserver(() => {
    performReplacement();
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // 念押しの定期実行（古いゴミが後から復活する場合への対策）
  setInterval(performReplacement, 1000);
};

startEngine();
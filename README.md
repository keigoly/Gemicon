# GemAvatar Customizer

Google Gemini のユーザーアイコンや各Gemのアイコンを、自分好みの画像にカスタマイズできるChrome拡張機能です。

## ✨ 特徴

* **個別カスタマイズ:** 特定のGem（「新規 アプリ開発」など）ごとに異なるアイコンを設定可能。
* **簡単アップロード:** 設定画面から好きな画像をアップロードするだけで即反映。
* **多言語対応:** 日本語・英語に対応（UIから切り替え可能）。
* **ダークモード:** システム設定、ライト、ダークモードから選択可能。
* **安全な設計:** 画像データはブラウザ内にのみ保存され、外部サーバーには送信されません。

## 📦 インストール方法（開発者向け）

このリポジトリをクローンしてビルドし、Chromeに読み込ませる手順です。

### 必要要件
* Node.js (v16以上推奨)
* npm

### 手順

1.  **リポジトリをクローン**
    ```bash
    git clone [https://github.com/your-username/gemavatar-customizer.git](https://github.com/your-username/gemavatar-customizer.git)
    cd gemavatar-customizer
    ```

2.  **依存パッケージのインストール**
    ```bash
    npm install
    ```

3.  **ビルド**
    ```bash
    npm run build
    ```
    `dist` フォルダが生成されます。

4.  **Chromeへの読み込み**
    1.  Chromeブラウザで `chrome://extensions/` を開く。
    2.  右上の「デベロッパーモード」をONにする。
    3.  「パッケージ化されていない拡張機能を読み込む」をクリック。
    4.  生成された `dist` フォルダを選択する。

## 🚀 使い方

1.  Chromeのツールバーから「GemAvatar」アイコンをクリック。
2.  **「対象のGem名」** に、アイコンを変えたいGemの名前（例: `新規 アプリ開発`）を入力。
    * ※ Geminiの画面に表示されている名前と完全一致させる必要があります。
3.  **「ファイルを読み込む」** ボタンから、設定したい画像を選択。
4.  **「設定を追加」** をクリック。
5.  リストに追加されたら、**「更新 (Update)」** ボタンを押して反映。

## 🛠 技術スタック

* TypeScript
* Vite
* Manifest V3
* Chrome Storage API

## 📝 ライセンス

MIT License
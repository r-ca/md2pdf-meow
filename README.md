# md2pdf-meow 🐈

TypeScript ベースの Markdown → HTML → PDF 変換パイプラインです。ビルド時には日本語メッセージ付きのログを流しながら、Markdown の連結・DocToc の生成・テンプレート描画・アセットのインライン化・Puppeteer を使った PDF 生成を一括で実行します。

## 使い方
1. 依存関係をインストール: `npm install`
2. 変換を実行: `npm run build`
   - `documents/files.txt` に列挙された Markdown が連結され、`dist/result.pdf` と `dist/all.html` が生成されます。
   - Chrome / Chromium が見つからない場合はエラーで停止し、`PUPPETEER_EXECUTABLE_PATH` の設定が案内されます。

## 技術メモ
- パイプライン全体は `tsx src/cli.ts` で実行される TypeScript 製 CLI で、各工程ごとに `INFO / SUCC / WARN / ERROR` ログを順番に出力します。
- `src/pipeline/renderMarkdown.ts` と `src/pipeline/renderTemplate.ts` は [2SC1815J/md2pdf](https://github.com/2SC1815J/md2pdf) で提供されていた `scripts/mdit.js` / `scripts/ejs.js` を MIT ライセンスの条件を保ったまま TypeScript へ移植し、プロジェクト内で利用できるようにしています。
- 画像やスタイルシートは `html-inline` を通して HTML に埋め込み、オフラインでも崩れない成果物を出力します。
- `documents/` 配下の Markdown からは相対パスで画像を参照でき、ビルド時に `work/assets/` へ自動コピーしたうえで HTML / PDF に反映します。外部 URL やデータ URI もそのまま扱えます。
- PDF 生成は `puppeteer-html-pdf` を使い、Chrome 不在時には明示的に検出するようになっています。

## 移植元
- https://github.com/2SC1815J/md2pdf

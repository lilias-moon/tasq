# tasq

ローカルで動くデスクトップ向けタスク管理アプリです。  
Tauri 2 + Vanilla JS + Matter.js（物理ブロック UI）で構成しています。

## ブランチ

| ブランチ | 説明 |
| --- | --- |
| `refact` | **現在作業中のブランチ。** コードを見る・レビューする・アドバイスするときはこちらを見てください。 |
| `main` | 安定寄り／マージ先。進行中の変更はここに無いことがあります。 |
| `feature/server` | 個人利用向けの実験ブランチ。別リポジトリの `tasq-server` との連携を想定した構築です（公開・共用前提ではありません）。 |

`feature/server` のサーバ側実装は本リポジトリには含めず、`tasq-server` 側で扱います。

> 作業中のコードは未完成のままブランチに置いていることがあります。最新の意図は `refact` を優先して確認してください。

## セットアップ

前提: [Rust](https://www.rust-lang.org/)、[Node.js](https://nodejs.org/)、Tauri の依存関係

```bash
npm install
npm run tauri dev
```

## 構成（ざっくり）

- `src/` … フロント（HTML / CSS / JS、Matter.js）
- `src-tauri/` … Tauri / Rust（IPC・ローカル永続化など）

## IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

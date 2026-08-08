# tasq

[日本語](#日本語) | [English](#english) | [한국어](#한국어)

---

## 日本語

ローカルで動くデスクトップ向けタスク管理アプリです。  
Tauri 2 + Vanilla JS + Matter.js（物理ブロック UI）で構成しています。

### ブランチ

| ブランチ | 説明 |
| --- | --- |
| `refact` | **現在作業中のブランチ。** コードを見る・レビューする・アドバイスするときはこちらを見てください。 |
| `main` | 安定寄り／マージ先。進行中の変更はここに無いことがあります。 |
| `feature/server` | 個人利用向けの実験ブランチ。別リポジトリの `tasq-server` との連携を想定した構築です（公開・共用前提ではありません）。 |

`feature/server` のサーバ側実装は本リポジトリには含めず、`tasq-server` 側で扱います。

> 作業中のコードは未完成のままブランチに置いていることがあります。最新の意図は `refact` を優先して確認してください。

### セットアップ

前提: [Rust](https://www.rust-lang.org/)、[Node.js](https://nodejs.org/)、Tauri の依存関係

```bash
npm install
npm run tauri dev
```

### 構成（ざっくり）

- `src/` … フロント（HTML / CSS / JS、Matter.js）
- `src-tauri/` … Tauri / Rust（IPC・ローカル永続化など）

### IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## English

A local desktop task manager.  
Built with Tauri 2, vanilla JS, and Matter.js (physics-block UI).

### Branches

| Branch | Description |
| --- | --- |
| `refact` | **Current working branch.** Read, review, and advise against this branch. |
| `main` | More stable / merge target. In-progress work may not be here. |
| `feature/server` | Personal/experimental branch. Intended to integrate with a separate `tasq-server` repository (not meant for public/shared use). |

Server-side code for `feature/server` lives in `tasq-server`, not in this repository.

> Work-in-progress code may sit unfinished on a branch. Prefer `refact` for the latest intent.

### Setup

Requires [Rust](https://www.rust-lang.org/), [Node.js](https://nodejs.org/), and Tauri’s system dependencies.

```bash
npm install
npm run tauri dev
```

### Layout (rough)

- `src/` — frontend (HTML / CSS / JS, Matter.js)
- `src-tauri/` — Tauri / Rust (IPC, local persistence, etc.)

### IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## 한국어

로컬에서 동작하는 데스크톱 작업 관리 앱입니다.  
Tauri 2 + Vanilla JS + Matter.js(물리 블록 UI)로 구성되어 있습니다.

### 브랜치

| 브랜치 | 설명 |
| --- | --- |
| `refact` | **현재 작업 중인 브랜치.** 코드를 보거나 리뷰·조언할 때는 이쪽을 봐 주세요. |
| `main` | 안정 쪽에 가까운 / 머지 대상. 진행 중인 변경이 여기 없을 수 있습니다. |
| `feature/server` | 개인용 실험 브랜치. 별도 저장소 `tasq-server` 와의 연동을 상정한 구성입니다 (공개·공용 전제가 아닙니다). |

`feature/server` 의 서버 측 구현은 이 저장소가 아니라 `tasq-server` 쪽에 둡니다.

> 작업 중인 코드는 미완성인 채로 브랜치에 있을 수 있습니다. 최신 의도는 `refact` 를 우선해 확인해 주세요.

### 설정

필요: [Rust](https://www.rust-lang.org/), [Node.js](https://nodejs.org/), Tauri 의존성

```bash
npm install
npm run tauri dev
```

### 구성 (대략)

- `src/` … 프론트엔드 (HTML / CSS / JS, Matter.js)
- `src-tauri/` … Tauri / Rust (IPC, 로컬 영속화 등)

### IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**DeepSeek Harness のタスクをペットと一緒に進めましょう**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[更新履歴](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![ライセンス：Apache-2.0](https://img.shields.io/badge/ライセンス-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![npm ダウンロード数](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet はコミュニティによって管理されている DeepSeek Harness（DSH）向けペットプラグインであり、OpenAI または DeepSeek AI の公式製品ではありません。1.0.1 以降、DSH `0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`〜`0.2.1-rc.5`、`0.2.2-rc.1` をサポートしています。これより前のホストおよび `0.2.1` のアルファ版はバージョンゲートによって拒否されプラグインは実行されません（ローカルの設定やカスタムペットは削除されません）。

## 機能の概要

DSH で作業中、かわいいペットが画面の隅であなたに寄り添い、タスクの進行状況や対応が必要なリクエストを分かりやすく通知します。組み込みの 9 匹のペットから選ぶことも、付属の Skill を使って独自のペットを作成することもできます。

- **9 匹の組み込みペット**：ペット設定からお気に入りの相棒を選び、サイズを調整できます。アセットはローカルに同梱されています。
- **ページ内での同伴**：DSH Web 内で一緒に作業します。デスクトップのフローティングペットはペット機能をサポートするデスクトップ版が必要です。
- **複数タスクの状況を一目で把握**：実行中、完了、エラー、対応待ちのリクエストを随時確認。通知がないときはペットのみが表示されます。
- **通知から素早くアクション**：通知から該当するタスクを開く、現在のターンを停止する、あるいは承認・質問・計画などのリクエストに直接回答できます。
- **必要な時は静かに**：タスクを停止せずに個別の通知のみを閉じることや、右クリックメニューまたは設定からペットを一時的に隠すことができます。
- **オリジナルペットを作成**：設定でペットの特徴を記述し、同梱の `hatch-pet` Skill を呼び出して DSH タスクとして自動作成できます。
- **ちょっとしたインタラクション**：ドラッグして移動、ダブルクリックでジャンプ、右クリックでペットメニューを開きます。

## スクリーンショット

### 複数タスクの通知

相棒のそばに実行中のタスクが表示され、会話を開く・停止する・通知を閉じるなどの操作を個別に行えます。

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="2件の実行中タスク通知とペット" width="403">
</p>

### ペット設定

9 匹の組み込みペットから選択し、カスタムペットフォルダを開き、ペットの表示サイズを調整します。

![ペットライブラリと外観設定](assets/screenshots/pet-settings.png)

### 会話画面での同伴

ペットと通知がページの隅に控えめに常駐するため、DSH での作業を妨げません。

![DSH 会話とペット通知](assets/screenshots/pet-conversation.png)

## DSH エコシステム製品

デスクトップ作業環境には [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) のダウンロードをお勧めします。既存の [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 環境には、必要に応じて各プラグインを追加できます。

| プラグイン | できること |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | プロジェクトと会話の整理、タスク検索、チャットターンの素早い移動 |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | タスクに適した専門家エージェントの選定と呼び出し |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | ローカルスキルの検索、有効化、新規作成、インポート |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | アーカイブされた過去の会話の検索、復元、整理 |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | メッセージングプラットフォーム経由でのタスク送信と返信受信 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 定期タスクのスケジュール設定と実行結果の確認 |
| [BTW](https://github.com/MichengAI/dsh-btw) | メインタスクを中断せずに横道での質問を行う |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | `/simplify` を使って Git 変更範囲内のコード品質を向上 |
| [PUA](https://github.com/MichengAI/dsh-pua) | 失敗時の別アプローチの模索、原因調査、完了前の十分な検証をエージェントに促す |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | `/review` で独立したエージェントによるコードレビューを実施 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | デスクトップペットを通じて会話通知を確認し、ツール承認や質問に回答 |

## インストール

対応 DSH バージョン：**`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`〜`0.2.1-rc.5`、`0.2.2-rc.1`**。端末で `dsh` コマンドが利用可能であることを確認してください。以下の例では `web` プロファイルを使用していますが、実際の対象プロファイルに適宜置き換えてください。

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

インストール後に DSH を再起動し、**設定 → ペット**（英語 UI では **Settings → Pets**）を開いてください。

## 使い方

**設定 → ペット**を開くか、ペットを右クリックしてメニューから設定を開きます。

| 目的 | 操作 |
| --- | --- |
| 相棒を選ぶ | 設定でペットを選択し、サイズを調整します。 |
| 移動・遊ぶ | ドラッグして移動、ダブルクリックでジャンプさせます。 |
| タスク通知を読む | 吹き出し通知を確認し、複数ある場合は展開します。 |
| 会話を続ける | 通知をクリックして対応する DSH タスクを開きます。 |
| リクエストに対応 | リクエスト詳細を開き、承認・質問回答・計画確認を行います。 |
| ターンを停止 | 実行中タスクの通知にある停止ボタンをクリックします。 |
| 通知を閉じる | 閉じるボタンをクリックします（タスク自体は停止しません）。 |
| ペットを隠す・復元 | 右クリックメニューまたは設定から切り替えます。 |

### カスタムペットの作成

1. ペット設定を開き、**+** アイコン（`作成`）をクリックしてペットの説明を入力します。
2. **DSH で作成**をクリックすると、プラグインが専用タスクを開き同梱の Skill 命令を送信します。
3. タスクの進行を見守ります（作成には DSH に画像生成ツールが設定されている必要があります）。
4. ペット画像が生成・保存されたら、ペットライブラリを更新して新しいペットを選択します。

## 更新とアンインストール

更新は DSH プラグインマネージャーから行うか、端末で更新コマンドを実行してください：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

アンインストールする場合：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

カスタムペットはデフォルトでユーザーディレクトリの `.dsh/codex-pet/pets` に保存されます。アンインストールしてもこれらの設定や自作ペットファイルが消去されることはありません。

## 開発への参加

ローカル開発、テスト、リリースの手順については、[開発と検証ガイド（中国語）](https://github.com/MichengAI/dsh-codex-pet/blob/main/CONTRIBUTING.md) をご覧ください。GitHub および npm にはすぐに実行可能な `lib` が同梱されています。ソースコードを変更した際は、コミット前に `npm run build` を実行してください。

## ライセンス

本プラグインのオリジナルコードは [Apache License 2.0](LICENSE) の下で提供されます。同梱されているペットのドット絵アセットは OpenAI Codex に由来しており、本プロジェクトの Apache-2.0 ライセンス許諾の対象外となります。詳細は [NOTICE](NOTICE) をご覧ください。

# n8n-nodes-discord

Discord API 連携用の n8n Community Node パッケージ。REST リソース、Gateway イベント、Webhook イベント、OAuth2、Permissions、Monetization まで Discord Developer Platform を広くカバーします。

[English](README.md) | 日本語

## リソース

`Discord` REST ノードは 26 リソースを機能カテゴリで提供します：

**メッセージ & コンテンツ**
- `Message`, `Channel`, `Webhook`, `Sticker`, `Emoji`, `Soundboard`, `Poll`

**サーバ管理**
- `Guild`, `Member`, `Role`, `Invite`, `AuditLog`, `Voice`

**Interactions & コマンド**
- `ApplicationCommand`, `InteractionResponse`

**コミュニティ & イベント**
- `GuildScheduledEvent`, `GuildTemplate`, `StageInstance`

**マネタイゼーション**
- `SKU`, `Subscription`, `Entitlement`

**モデレーション**
- `AutoModeration`

**アプリプラットフォーム**
- `Application`, `ApplicationRoleConnectionMetadata`, `Lobby`, `User`

`Message`、`Webhook`、`InteractionResponse` は embeds、components（buttons / selects / text inputs / V2 layout）、attachments（multipart アップロード）、allowed mentions の guided builder を備えます。`ApplicationCommand` は slash command の CRUD に加えて localization、contexts、integration types、`default_member_permissions` 選択器を提供。サーバ側の変更操作には audit log reason フィールドが付きます。

## Trigger

- `Discord Trigger` — WebSocket 経由の Gateway 接続。Identify、heartbeat、resume、reconnect、session 永続化。全 Gateway イベントカタログを選択可能で、privileged intent のメタデータも付与。`Connection Name` で `Discord Gateway Send` から参照可能。
- `Discord Webhook Event Trigger` — Discord Application Webhook Events（`APPLICATION_AUTHORIZED`、`ENTITLEMENT_CREATE` 等）を HTTPS で受信。Ed25519 署名検証とイベント型フィルタを内蔵。

## アクション補助ノード

- `Discord Gateway Send` — 起動中の `Discord Trigger` 接続を経由して Gateway コマンド（Update Presence、Update Voice State、Request Guild Members、Request Soundboard Sounds）を送信。AI Agent からの tool 利用にも対応（`usableAsTool: true`）。

## Credentials

- `Discord Bot API` — Bot トークン、`Authorization: Bot <token>` ヘッダ。サーバ自動化のデフォルト。
- `Discord OAuth2 API` — Authorization Code Grant（ユーザートークン用フロー）。ノードの `Authentication` セレクタで選択。
- `Discord Webhook API` — 受信用 Webhook URL。
- `Discord Interaction API` — application ID と Ed25519 public key。Webhook Event Trigger が使用。

## カバレッジ

公式 Discord ドキュメント index に対するリソース別ステータスは [`docs/coverage-matrix.md`](docs/coverage-matrix.md) を参照。実装チェックリストは [`docs/discord-full-coverage-todo.md`](docs/discord-full-coverage-todo.md)、ワークフロー例は [`docs/examples/`](docs/examples/) にあります。

## 開発

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Discord 側の準備

1. Discord Developer Portal で application を作成。
2. Bot を追加。
3. Bot token を `Discord Bot API` credential に設定。
4. Trigger で privileged intent が必要なイベントを使う場合、Developer Portal で該当 intent (`GUILD_MEMBERS` / `GUILD_PRESENCES` / `MESSAGE_CONTENT`) を有効化。
5. 必要な権限を付けて Bot をサーバへ招待。
6. Webhook Events を使う場合、application の Webhook Events URL を `Discord Webhook Event Trigger` の URL に設定し、application の public key を `Discord Interaction API` credential に登録。

## アーキテクチャ

REST ノードは n8n の declarative routing を採用。embeds、components、attachments、allowed mentions、application commands、interaction responses など複雑な payload は shared builder と raw JSON fallback を併用します。

Gateway Trigger は Discord Gateway WebSocket を使用。heartbeat ACK、session ID、sequence number、close-code 対応の reconnect state を管理し、`nodes/DiscordTrigger/events/` に privileged intent とイベント別 required intent のメタデータを持ちます。Gateway Send アクションノードは `Connection Name` 経由のプロセス内 bus で同じ WebSocket にコマンドを乗せます。

Webhook Event Trigger は Node 組み込みの `node:crypto`（Ed25519）で署名検証を行い、サードパーティ依存を持ちません。

## License

[MIT](LICENSE.md)

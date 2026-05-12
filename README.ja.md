# n8n-nodes-discord

Discord API 連携用の n8n Community Node パッケージです。REST リソース、Gateway イベント、HTTP インタラクション、Webhook、OAuth2、Permissions、Monetization など Discord Developer Platform を広くカバーしています。

[English](README.md) | 日本語

## リソース

`Discord` REST ノードは26リソースを提供します:

Application, ApplicationCommand, ApplicationRoleConnectionMetadata, AuditLog, AutoModeration, Channel, Emoji, Entitlement, Guild, GuildScheduledEvent, GuildTemplate, InteractionResponse, Invite, Lobby, Member, Message, Poll, Role, SKU, Soundboard, StageInstance, Sticker, Subscription, User, Voice, Webhook。

Message、Webhook、InteractionResponse は embeds、attachments（multipart アップロード対応）、allowed mentions の guided builder と、components の raw JSON 入力をサポートします。ApplicationCommand は localization、contexts、integration types、permission フィールドに対応。サーバー側の変更操作には audit log reason フィールドが付きます。

## Trigger

- `Discord Trigger` — WebSocket 経由の Gateway 接続。Identify、heartbeat、resume、reconnect、session 永続化をサポート。全 Gateway イベントカタログから選択でき、privileged intent のメタデータも付与されています。`Connection Name` で `Discord Gateway Command` から参照可能。
- `Discord HTTP Interaction Trigger` — HTTPS 経由で Discord application interaction を受信。Ed25519 署名検証と PING/PONG の自動応答を内蔵。
- `Discord Webhook Event Trigger` — Discord Application Webhook Events（APPLICATION_AUTHORIZED、ENTITLEMENT_CREATE 等）を HTTPS で受信。Ed25519 署名検証とイベント型フィルター付き。

## アクション補助ノード

- `Discord Gateway Command` — 起動中の `Discord Trigger` の接続を経由して Gateway コマンド（Update Presence、Update Voice State、Request Guild Members、Request Soundboard Sounds）を送信。
- `Discord OAuth2` — Bot install URL、OAuth2 authorize URL、トークン revocation URL を生成する純計算ノード。

## Credentials

- `Discord Bot API` — Bot トークン、`Authorization: Bot <token>` ヘッダ。
- `Discord OAuth2 API` — Authorization Code Grant（ユーザートークン用フロー）。
- `Discord Webhook API` — 受信用 Webhook URL。
- `Discord Interaction API` — application ID と Ed25519 public key（HTTP インタラクション用）。

## カバレッジ

公式 Discord ドキュメントの index に対するリソース単位のステータスは [`docs/coverage-matrix.md`](docs/coverage-matrix.md) を参照してください。実装チェックリストは [`docs/discord-full-coverage-todo.md`](docs/discord-full-coverage-todo.md) です。ワークフロー例は [`docs/examples/`](docs/examples/) にあります。

## 開発

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Discord 側の準備

1. Discord Developer Portal で application を作成します。
2. Bot を追加します。
3. Bot token を `Discord Bot API` credential に設定します。
4. Trigger で privileged intent が必要なイベントを使う場合は Developer Portal で該当 intent (GUILD_MEMBERS、GUILD_PRESENCES、MESSAGE_CONTENT) を有効化します。
5. 必要な権限を付けて Bot をサーバーへ招待します。
6. HTTP インタラクションを使う場合は、application の Interactions Endpoint URL を `Discord HTTP Interaction Trigger` が生成する URL に設定し、application の public key を `Discord Interaction API` credential に登録します。

## アーキテクチャ

REST ノードは n8n の declarative routing を採用しています。embeds、components、attachments、allowed mentions、application commands、interaction responses など複雑な payload は shared builder と raw JSON fallback を併用します。

Gateway Trigger は Discord Gateway WebSocket を使います。heartbeat ACK、session ID、sequence number、reconnect state を管理し、`nodes/DiscordTrigger/events/` に privileged intent とイベント別 required intent のメタデータを持ちます。

HTTP インタラクション Trigger は Node 組み込みの `node:crypto`（Ed25519）で署名検証を行い、サードパーティ依存を持ちません。

## License

[MIT](LICENSE.md)

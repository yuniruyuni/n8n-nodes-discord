# n8n-nodes-discord

Discord API連携用のn8n Community Nodeパッケージです。REST APIリソース、Gatewayイベント、Webhooks、Interactions、OAuth2、Permissions、Monetization系リソースまで広く網羅する方針で開発しています。

[English](README.md) | 日本語

## 現在の開発状況

このリポジトリは `n8n-nodes-twitch` の設計パターンを元に初期構築した段階です。

実装済みの縦スライス:

- Discord Bot API credential
- Discord OAuth2 credential scaffold
- Discord Webhook credential scaffold
- Discord Interaction credential scaffold
- `Discord` node
  - User: current bot user取得、user取得
  - Message: 送信、取得、削除
  - Webhook: execute、取得
- `Discord Trigger` node
  - Gateway接続
  - Identify
  - Heartbeat / ACK監視
  - session state保存
  - 再接続
  - 主要イベントの初期selector

全網羅TODO:

- [docs/discord-full-coverage-todo.md](docs/discord-full-coverage-todo.md)

## 開発

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Discord側の準備

1. Discord Developer Portalでapplicationを作成します。
2. Botを追加します。
3. Bot tokenを `Discord Bot API` credential に設定します。
4. Triggerでprivileged intentが必要なイベントを使う場合はDeveloper Portalで該当intentを有効化します。
5. 必要な権限を付けてBotをサーバーへ招待します。

## アーキテクチャ

RESTノードは可能な範囲でn8nのdeclarative routingを使います。embeds、components、attachments、application commands、interaction responsesのような複雑なpayloadは、shared builderとraw JSON fallbackを併用する予定です。

TriggerノードはDiscord Gateway WebSocketを使います。heartbeat ACK、session ID、sequence number、reconnect stateを管理し、今後resumeとshardingを強化します。

## License

[MIT](LICENSE.md)

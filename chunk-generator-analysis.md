# chunk-generator 実装調査結果

## 概要
chunk-generatorは、Siv3Dプロジェクトのドキュメントを**Algolia検索エンジン**用に最適化された小さなchunk（塊）に分割するTypeScriptツールです。

## 主な目的
- Siv3Dのドキュメント（Markdown）を検索しやすい形に分割
- 検索精度向上のために適切なサイズのテキストチャンクを生成
- コードブロックの別途抽出と管理

## 技術スタック
- **TypeScript** - メイン言語
- **MDast** - Markdownの抽象構文木ライブラリ
- **Zod** - データスキーマ検証
- **esbuild** - バンドル・最適化
- **GitHub Actions** - CI/CD対応

## アーキテクチャ

### ファイル構成
```
chunk-generator/
├── src/
│   ├── index.ts           # メインエントリーポイント
│   └── lib/
│       ├── chunks.ts      # チャンク分割ロジック
│       ├── markdown.ts    # Markdown解析・処理
│       ├── sections.ts    # セクション分割
│       └── utils.ts       # ユーティリティ関数
├── schema.ts              # データスキーマ定義
├── package.json
├── actions.yml            # GitHub Actions設定
└── dist/                  # ビルド出力
```

### データスキーマ

#### Chunk（チャンク）
```typescript
{
  objectID: string,        // ユニークID
  pageID: string,          // ページID  
  headings: string[],      // ヘッダー階層（パンくずリスト）
  url: string,             // siv3d.github.io上のURL
  order: number,           // ページ内の順序
  content: string          // 内容（最大1000文字）
}
```

#### CodeBlock（コードブロック）
```typescript
{
  id: string,              // ユニークID
  pageId: string,          // ページID
  language: string | null, // プログラミング言語
  content: string          // コード内容
}
```

## 処理フロー

### 1. 初期化・検証
- コマンドライン引数の解析
- 必須パラメータの検証
- siv3d.docsディレクトリの存在確認
- 言語設定の検証（en-us / ja-jp）

### 2. Markdownファイル探索
- 指定された言語のMarkdownファイルを再帰的に探索
- ファイルパスからルート情報を生成
- ページIDの生成

### 3. Markdown解析
- MDastライブラリを使用してMarkdownをAST（抽象構文木）に変換
- ヘッダー構造の解析
- コードブロックの抽出
- MkDocs Admonition記法のサポート

### 4. チャンク分割
- セクション単位での分割
- 最大1000文字制限に基づく再分割
- ヘッダー階層の保持
- URL生成（アンカーリンク含む）

### 5. データ検証・出力
- Zodスキーマによるデータ検証
- IDの重複チェック
- JSONファイルとして出力
  - `chunks.json` - 検索用チャンク
  - `code-blocks.json` - コードブロック

## 実行方法

### CLI実行
```bash
ts-node src/index.ts \
  --siv3d-docs-path ../siv3d.docs \
  --siv3d-docs-language ja-jp \
  --chunks-output-path chunks.json \
  --code-blocks-output-path code-blocks.json
```

### GitHub Actions
- `actions.yml`でNode.js 20環境での実行を定義
- CI/CDパイプラインでの自動実行が可能

## 特徴的な機能

### 1. 適応的チャンク分割
- 1000文字制限を超える場合の自動分割
- 行単位での適切な分割点の選択
- ヘッダー情報の継承

### 2. 多言語対応
- en-us / ja-jp の両言語サポート
- 言語別の出力生成

### 3. MkDocs対応
- MkDocs Admonition記法のサポート
- カスタム拡張機能の実装

### 4. データ整合性
- ユニークID生成・検証
- スキーマ検証による品質保証
- エラーハンドリング

## 用途
このツールの主な用途は**Siv3Dドキュメントサイトの検索機能向上**です：
- Algolia検索インデックスの生成
- ドキュメント内容の細かい検索
- コードサンプルの検索
- 多言語ドキュメントの統合管理

## 実装の品質
- TypeScriptによる型安全性
- Zodによるランタイム検証
- 詳細なエラーハンドリング
- 明確なデータフロー設計
- 拡張可能なアーキテクチャ
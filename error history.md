# WEB 画像一括ダウンローダー - エラー履歴

プロジェクト開発中に発生した主要なエラーと対処法の記録

---

## 🔥 **第 1 回修正: フォルダ選択とダウンロード順序問題**

**不具合**: 保存先フォルダ選択前にダウンロードインジケーターが先走り表示される  
**対処**: フォルダ選択 → ダウンロード状態開始の正しい順序に修正。`setIsDownloading(true)`をフォルダ選択完了後に移動

**不具合**: 画像が 1 枚ずつダウンロードされ、毎回保存先確認ダイアログが表示される  
**対処**: File System Access API を使用してフォルダハンドルを取得し、一括保存処理に変更

**不具合**: フォルダ指定による一括ダウンロードが機能しない  
**対処**: `downloadToFolder`関数の実装で DirectoryHandle を使った直接ファイル保存に修正

---

## 🔧 **第 2 回修正: UI テキストと型エラー修正**

**不具合**: ボタンテキスト「個別ダウンロード（順次）」が機能と合わない  
**対処**: 「ダウンロード開始」にテキスト変更し、一括ダウンローダー向けの説明文に修正

**不具合**: `disabled`条件で null 型エラーが発生  
**対処**: TypeScript の厳密な型チェックに対応し、null 安全な条件分岐に修正

---

## 🚨 **第 3 回修正: API 検出とフォールバック機能**

**不具合**: File System Access API の動作が不安定で一括ダウンロードが失敗する  
**対処**: API の実際のテスト実行による動作確認を実装し、成功時のみ API 使用する仕組みに変更

**不具合**: 対応していないブラウザでのエラーハンドリングが不十分  
**対処**: フォールバック時に ZIP ダウンロード機能を追加し、JSZip 動的インポートを実装

---

## 📦 **第 4 回修正: 依存関係と ZIP 機能問題**

**不具合**: JSZip モジュール未インストールによる linter エラー発生  
**対処**: `npm install jszip @types/jszip`をすべきだが一時保留

**不具合**: ZIP 機能が元の要求と乖離している  
**対処**: ZIP 機能を完全削除し、未対応ブラウザには明確なメッセージ表示と対応ブラウザ案内に変更

---

## 🦊 **第 5 回修正: Firefox 互換性問題**

**不具合**: Firefox で`JSON.parse: unexpected character at line 1 column 1`エラーが発生  
**対処**: 画像取得時の fetch リクエストに headers 追加（User-Agent、Accept 等）し、CORS 設定を明示化

**不具合**: レスポンス内容が予期しない形式でエラーになる  
**対処**: Content-Type チェックとエラーハンドリングを強化し、レスポンス内容の詳細ログ出力を追加

---

## ⚙️ **第 6 回修正: UI 改善と機能追加**

**不具合**: 確認ダイアログのメッセージが不適切  
**対処**: `confirm()`ダイアログのメッセージを「編集しますか？」から「ダウンロード開始しますか？」に変更

**不具合**: ディスク残容量表示が不正確  
**対処**: `checkDiskSpace`関数を改善し、Storage API 未対応時のフォールバック値を設定

**不具合**: 免責・注意事項の表示機能がない  
**対処**: ヘッダーに新規ボタンを設置し、詳細モーダルに WEB 制作向け利用規約と MIT ライセンス情報を実装

---

## 🔐 **第 7 回修正: ユーザージェスチャー問題**

**不具合**: `confirm()`ダイアログ表示で`SecurityError: Must be handling a user gesture to show a file picker`エラー  
**対処**: `confirm()`をカスタム React モーダルに完全置換し、ユーザージェスチャーコンテキストを保持

**不具合**: Chrome 拡張機能関連エラーが併発  
**対処**: ユーザージェスチャーの適切な管理により`showDirectoryPicker`の正常動作を確保

---

## 🔨 **第 8 回修正: 構文エラーとファイル破損**

**不具合**: `Unexpected token 'div'. Expected jsx identifier`構文エラーでコンパイル失敗  
**対処**: ファイル破損により不完全な状態になっていたため、`DownloadControls.tsx`を完全再作成

**不具合**: JSX の構文問題でアプリケーションが起動しない  
**対処**: 適切な関数終了処理とファイル構造を確保し、構文エラーを完全解決

---

## ✨ **第 9 回修正: 初回利用とフォルダ記憶機能**

**不具合**: 初回利用時の注意事項表示機能がない  
**対処**: `localStorage`を使用した初回判定機能を実装し、詳細な注意事項モーダルを追加

**不具合**: ダウンロード保存先が毎回リセットされる  
**対処**: `DirectoryHandle`の権限チェック機能を実装し、前回選択フォルダの記憶機能を追加

---

## 📊 **技術的学習ポイント**

### **File System Access API 関連**

- ブラウザ対応状況の事前確認が重要
- ユーザージェスチャーコンテキストの適切な管理が必須
- フォールバック機能の実装でユーザビリティ向上

### **State Management**

- React Hooks での状態管理順序が重要
- 非同期処理と UI の同期タイミングに注意が必要

### **エラーハンドリング**

- ブラウザ間の互換性問題への対応
- 適切な Content-Type チェックでセキュリティ向上

### **TypeScript**

- 厳密な型チェックによる品質向上
- null 安全な実装でランタイムエラー防止

### **UX/UI 設計**

- カスタムモーダルでブラウザ API 制限を回避
- localStorage 活用でユーザー体験向上

---

## 🎯 **開発で重要だった対処パターン**

1. **段階的デバッグ**: 複雑な問題は小さな単位に分割して解決
2. **ブラウザ差異対応**: 各ブラウザの実装差に対する適切なフォールバック
3. **ユーザビリティ優先**: 技術的制約を UI/UX 工夫で解決
4. **コード品質**: TypeScript の型システム活用でバグ防止
5. **セキュリティ配慮**: CORS 設定と適切な header 管理で安全性確保

---

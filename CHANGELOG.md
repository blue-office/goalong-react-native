# Changelog

## 0.2.0

- 保存先(`storage`)を `configure` で渡す形に変更し、`@react-native-async-storage/async-storage` への依存をなくしました(SDK はネイティブモジュールに依存しません)。AsyncStorage を使う場合は `storage: AsyncStorage` を渡してください

## 0.1.0

- 最初のリリース: 初期化、RevenueCat 連携、紹介コードの検証・適用・取り消し、紹介リンクからの抽出、入力欄(CreatorCodeInput / useCreatorCode)、初回画面の入口(ReferralEntry)

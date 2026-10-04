# GoAlong SDK for React Native

インフルエンサーの紹介コード・紹介リンクを、アプリ内の課金(RevenueCat)に結び付けるための SDK です。
ユーザーが入力・確認した紹介だけを根拠に計測し、フィンガープリント・IDFA・IP アドレスによる推定は行いません(ATT のダイアログは不要です)。

- 対象: React Native 0.72 以上(iOS / Android で動作。報酬の対象になる課金は App Store の課金です)
- 必要: [RevenueCat](https://www.revenuecat.com/)(`react-native-purchases`)、GoAlong のアカウント
- 詳しい手順: [GoAlong ドキュメント](https://goalong.me/docs)

## インストール

```sh
npm install github:blue-office/goalong-react-native#0.1.0 @react-native-async-storage/async-storage
cd ios && pod install
```

`@react-native-async-storage/async-storage` は、端末ごとのインストール ID を保存するために使います(必須)。Expo の場合は `npx expo install @react-native-async-storage/async-storage` で入れてください。
独自の保存先を使う場合は、`configure` の `storage` に `getItem` / `setItem` / `removeItem` を持つオブジェクトを渡せます。

## 1. 初期化する

アプリの起動時に一度だけ呼びます。

```ts
import { GoAlong } from "@goalong/react-native";

GoAlong.configure({
  appId: "YOUR_APP_ID",  // GoAlong のアプリ詳細に表示される ID(Bundle ID ではありません)
  appSlug: "your-app",   // 紹介リンクの slug。指定を推奨
  // いま有効な購読があるか(有効な購読があるユーザーは紹介の対象外)。
  // GoAlong の特典などで付与された無料期間(rc_promo_ で始まる)は購読に数えない
  isActiveSubscriber: async () => {
    const info = await Purchases.getCustomerInfo();
    return info.activeSubscriptions.some((id) => !id.startsWith("rc_promo"));
  },
});
```

## 2. RevenueCat と連携する

```ts
import Purchases from "react-native-purchases";

Purchases.configure({ apiKey, appUserID });
await GoAlong.setRevenueCatUserID(await Purchases.getAppUserID()); // ログインなどでユーザーが変わったときも

// 課金と紹介を結び付ける属性。購入より前に、紹介コードの適用後・取り消し後にも設定し直す
async function syncGoAlongAttributes() {
  const attrs = await GoAlong.attributionAttributes();
  // 含まれない属性は空文字で消す(取り消し後に goalong_referred が残らないように)
  await Purchases.setAttributes({
    goalong_referred: "",
    goalong_offering: "",
    ...attrs,
  });
}
await syncGoAlongAttributes();
```

RevenueCat の Targeting(紹介ユーザーにだけ別の Offering を出すなど)を使う場合は、ペイウォールを開く前に `await Purchases.syncAttributesAndOfferingsIfNeeded()` を呼び、その戻り値の Offerings を使ってください。

`setRevenueCatUserID` を呼ぶと、ログイン前の画面で紹介が成立していた場合に、まだ付いていないユーザー特典を取りに行きます。

## 3. 紹介コードの入力欄を置く(必須)

動画などでコードを伝えられたユーザーが入力するための欄です。入力欄がないアプリでは、こうした紹介を計測できません。

```tsx
import { CreatorCodeInput } from "@goalong/react-native";

<CreatorCodeInput
  onApplied={() => syncGoAlongAttributes()}
  onSkip={() => navigation.goBack()}
/>
```

- 入力されたコードを確認し、特典があれば「このコードで ◯◯」と「このコードを使う」を表示します
- 紹介リンクを貼り付けると、コードだけを取り出して自動で適用します
- 別の紹介コードが適用済みなら「このコードに変更する」を表示します(黙って上書きしません)
- 誰の紹介かはユーザーに表示しません。紹介の取り消しは `GoAlong.removeReferral()` で行えます(既成 UI には出しません)
- 色と文言は `theme` と `labels` で変えられます

```tsx
<CreatorCodeInput theme={{ accent: "#FF5A1F", onAccent: "#FFFFFF" }} labels={{ title: "招待コード" }} />
```

### デザインを自作する

```tsx
import { useCreatorCode } from "@goalong/react-native";

const { code, setCode, phase, apply, replace, retry, submit } = useCreatorCode();
// phase.type: idle / checking / valid(perk) / applying / done(perk) / failed(failure)
// valid のとき apply()(このコードを使う)、failure.kind === "conflict" のとき replace()
// キーボードの確定は submit()(形式に合わなければ形式エラー)
```

## 4. 初回画面の入口(おすすめ)

```tsx
import * as Clipboard from "expo-clipboard";
import { ReferralEntry } from "@goalong/react-native";

<ReferralEntry getClipboardText={() => Clipboard.getStringAsync()} />
```

紹介を適用済みなら何も表示しません。紹介リンクがコピーされていれば入力欄を開いた状態で、使える紹介コードがあるときは小さな入口を表示します。`getClipboardText` は省略できます(省略するとクリップボードは読みません)。

## 5. 紹介リンクでアプリを開く(Universal Links)

GoAlong のアプリ詳細で Team ID と Bundle ID を登録し、Associated Domains に `applinks:goalong.me` を追加します。
iOS ネイティブ側でリンクを JavaScript に渡す設定(`AppDelegate` で `RCTLinkingManager` を呼ぶ)が必要です。React Native の公式手順([Linking: Enabling Deep Links](https://reactnative.dev/docs/linking#enabling-deep-links))に従ってください。Expo では不要です。

```ts
import { Linking } from "react-native";

function onUrl(url: string | null) {
  const code = url ? GoAlong.handleDeepLink(url) : null; // 取り出すだけ。適用はしない
  if (code) {
    // ユーザーに確認してから適用する
    // await GoAlong.applyCode(code, { method: "DEEP_LINK" });
  }
}

Linking.getInitialURL().then(onUrl);                     // リンクからアプリが起動したとき
Linking.addEventListener("url", ({ url }) => onUrl(url)); // 起動中にリンクを開いたとき
```

## API

| API | 説明 |
|---|---|
| `GoAlong.configure(config)` | 起動時に一度呼ぶ |
| `GoAlong.setRevenueCatUserID(id)` | RevenueCat の設定直後・ユーザーの切り替え時に呼ぶ |
| `GoAlong.attributionAttributes()` | RevenueCat に渡す属性 |
| `GoAlong.installationId()` | この端末のインストール ID |
| `GoAlong.validateCode(code)` | 適用せずに検証する |
| `GoAlong.applyCode(code, { method, rcAppUserId, confirmReplace })` | コードを適用する |
| `GoAlong.currentReferral()` / `GoAlong.removeReferral()` | 紹介の状態 / 取り消し |
| `GoAlong.handleDeepLink(url)` / `GoAlong.extractCode(text)` | 紹介リンクからコードを取り出す |
| `GoAlong.referralEntryEnabled()` | 入口を出してよいか |

`applyCode` の結果(`type`): `applied` / `alreadyApplied` / `conflict` / `existingSubscriber` / `notFound`

## プライバシー

インストール ID(端末に保存する識別子)、RevenueCat のユーザー ID、紹介コード、端末とアプリの情報(OS・アプリ・SDK のバージョン、言語・地域)を GoAlong に送信します。クリップボードは、`getClipboardText` を渡したときだけ読み取り、紹介コード以外の内容は送信しません。

## ライセンス

MIT

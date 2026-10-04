import type { ApplyMethod, ApplyResult, CodeValidation, GoAlongPerk, ReferralSnapshot } from "./models";
import { type GoAlongStorage } from "./storage";
export declare const SDK_VERSION = "react-native-0.1.0";
export interface DeviceMeta {
    osVersion?: string;
    appVersion?: string;
    locale?: string;
}
export interface GoAlongConfig {
    /** GoAlong のアプリ詳細に表示される ID(Bundle ID ではありません) */
    appId: string;
    /** 紹介リンクの slug。指定を推奨(他のアプリのリンクの混入を防ぐ) */
    appSlug?: string;
    /** 既定 https://goalong.me */
    baseUrl?: string;
    /** 端末の保存先。既定は AsyncStorage */
    storage?: GoAlongStorage;
    /**
     * いま有効な購読があるか(RevenueCat の CustomerInfo などで判定)。
     * true を返すと紹介コードを送信せず existingSubscriber を返す(有効な購読があるユーザーは紹介の対象外)
     */
    isActiveSubscriber?: () => Promise<boolean>;
    /** 端末情報(既定は react-native の Platform から取得) */
    deviceMeta?: () => DeviceMeta;
    /** テスト用 */
    fetch?: typeof fetch;
}
/** GoAlong SDK(React Native) */
export declare const GoAlong: {
    /** 起動時に 1 回呼ぶ。初回起動の登録は裏で行う */
    configure(config: GoAlongConfig): void;
    /** この端末の GoAlong のインストール ID */
    installationId(): Promise<string>;
    /**
     * RevenueCat のユーザー ID を渡す(Purchases.configure の直後・ログインなどでユーザーが変わったとき)。
     * 紹介が適用済みなら、まだ付いていないユーザー特典を取りに行き、付与された特典を返す
     */
    setRevenueCatUserID(rcAppUserId: string): Promise<GoAlongPerk | null>;
    /**
     * RevenueCat の Subscriber Attributes に渡す属性。
     * `Purchases.setAttributes(await GoAlong.attributionAttributes())` を購入より前に呼ぶ
     */
    attributionAttributes(): Promise<Record<string, string>>;
    /** setRevenueCatUserID で ID を受け取っているか */
    hasRevenueCatUserID(): Promise<boolean>;
    /** この端末で紹介が適用済みか(サーバーに問い合わせない) */
    hasAppliedReferralLocally(): Promise<boolean>;
    /** 適用せずに検証する(紹介者の名前の確認など) */
    validateCode(code: string): Promise<CodeValidation>;
    /**
     * コードを適用する。rcAppUserId を省略すると setRevenueCatUserID で受け取った ID を使う。
     * conflict(別の紹介者のコードを適用済み)のときは、ユーザーに確認してから confirmReplace: true で再実行する
     */
    applyCode(code: string, options?: {
        method?: ApplyMethod;
        rcAppUserId?: string;
        confirmReplace?: boolean;
    }): Promise<ApplyResult>;
    /** いまの紹介の状態 */
    currentReferral(): Promise<ReferralSnapshot>;
    /** 紹介を取り消す(以後の課金は紹介に結び付かない。受け取り済みの特典は期限まで使える) */
    removeReferral(): Promise<boolean>;
    /** 紹介リンク(https://goalong.me/{appSlug}/{CODE})からコードを取り出す。適用はしない */
    handleDeepLink(url: string): string | null;
    /** 入力された文字列が紹介リンクなら、コードを取り出す */
    extractCode(text: string): string | null;
    /** 紹介コードの入口を出してよいか(使える紹介コードがあるか)。サーバーの指定する時間だけキャッシュする */
    referralEntryEnabled(): Promise<boolean>;
};
/** テスト用: 設定とキャッシュを消す */
export declare function __resetForTesting(): void;

import type { GoAlongPerk } from "./models";
export type CreatorCodeFailure = {
    kind: "invalidFormat";
} | {
    kind: "notFound";
} | {
    kind: "expired";
} | {
    kind: "existingSubscriber";
} | {
    kind: "conflict";
} | {
    kind: "network";
};
export type CreatorCodePhase = {
    type: "idle";
} | {
    type: "checking";
} | {
    type: "valid";
    perk: GoAlongPerk | null;
} | {
    type: "applying";
}
/** perkPending: 特典は RevenueCat のユーザー ID が分かったあと(ログイン後)に付与される */
 | {
    type: "done";
    perk: GoAlongPerk | null;
    perkPending: boolean;
} | {
    type: "failed";
    failure: CreatorCodeFailure;
};
export declare function useCreatorCode(options?: {
    rcAppUserId?: string;
    onApplied?: (perk: GoAlongPerk | null) => void;
}): {
    code: string;
    setCode: (text: string) => void;
    phase: CreatorCodePhase;
    /** 「このコードを使う」 */
    apply: () => Promise<void>;
    /** conflict のとき「このコードに変更する」 */
    replace: () => Promise<void>;
    retry: () => void;
    /** キーボードの確定(形式エラーの表示・valid なら適用) */
    submit: () => void;
    /** 入力形式のエラー(形式に合わない入力で確定しようとしたとき用) */
    isValidFormat: boolean;
};
export type CurrentReferralState = {
    type: "loading";
} | {
    type: "none";
} | {
    type: "applied";
    perk: GoAlongPerk | null;
} | {
    type: "removed";
};
/** 表示時点の紹介の状態(適用済みなら入力欄の代わりに状態を出す) */
export declare function useCurrentReferral(): CurrentReferralState;

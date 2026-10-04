export interface GoAlongCreator {
    displayName: string;
    avatarUrl: string | null;
}
export interface GoAlongPerk {
    /** 表示用の文言(例:「1 週間無料」) */
    label: string;
    entitlement?: string;
    duration?: string;
    /** 付与済みの特典の有効期限(currentReferral で返る) */
    expiresAtMs?: number | null;
}
export type ApplyMethod = "CODE" | "DEEP_LINK" | "CLIPBOARD";
export type CodeErrorKind = "invalid_format" | "not_found" | "expired";
export type CodeValidation = {
    valid: true;
    code: string;
    creator: GoAlongCreator | null;
    perk: GoAlongPerk | null;
} | {
    valid: false;
    error: CodeErrorKind;
};
/**
 * perk = 付与された特典(なければ null)。perkLabel = このコードの特典の名前(付与前・付与失敗でも入る。
 * perk が null で perkLabel があるときは、RevenueCat のユーザー ID が分かったあとに付与される)
 */
export type ApplyResult = {
    type: "applied";
    creator: GoAlongCreator | null;
    perk: GoAlongPerk | null;
    perkLabel: string | null;
    offeringKey: string | null;
} | {
    type: "alreadyApplied";
    creator: GoAlongCreator | null;
    perk: GoAlongPerk | null;
    perkLabel: string | null;
    offeringKey: string | null;
} | {
    type: "conflict";
    currentCreator: GoAlongCreator | null;
} | {
    type: "existingSubscriber";
} | {
    type: "notFound";
    error: CodeErrorKind | null;
};
export type ReferralSnapshot = {
    type: "none";
} | {
    type: "applied";
    creator: GoAlongCreator | null;
    appliedAt: Date | null;
    perk: GoAlongPerk | null;
} | {
    type: "removed";
    removedAt: Date | null;
};
export type GoAlongErrorKind = "notConfigured" | "network" | "server";
export declare class GoAlongError extends Error {
    readonly kind: GoAlongErrorKind;
    readonly statusCode?: number;
    constructor(kind: GoAlongErrorKind, message?: string, statusCode?: number);
}

export interface GoAlongTheme {
    /** 確定ボタン・完了表示の色 */
    accent: string;
    /** accent の上の文字色(accent とペアで指定) */
    onAccent: string;
    text: string;
    secondaryText: string;
    error: string;
    fieldBackground: string;
    cardBackground: string;
    cornerRadius: number;
}
export declare const lightTheme: GoAlongTheme;
export declare const darkTheme: GoAlongTheme;
/** 文言。{perk} は特典の表示文言、{date} は日付に置き換わる。紹介者名は表示しない */
export interface GoAlongLabels {
    title: string;
    placeholder: string;
    skip: string;
    useThisCode: string;
    perkPreview: string;
    appliedNoCreator: string;
    perkGranted: string;
    perkValidUntil: string;
    perkPending: string;
    errorFormat: string;
    errorNotFound: string;
    errorExpired: string;
    errorExistingSubscriber: string;
    errorNetwork: string;
    retry: string;
    errorConflict: string;
    replace: string;
    currentReferralNoCreator: string;
    removedNotice: string;
    entryPrompt: string;
}
export declare const defaultLabels: GoAlongLabels;
export declare function fill(template: string, values: {
    perk?: string;
    date?: string;
}): string;
export declare function formatDate(ms: number): string;

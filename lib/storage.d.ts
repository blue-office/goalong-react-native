export interface GoAlongStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}
export declare const KEYS: {
    readonly installationId: "goalong.installation_id";
    readonly installationReported: "goalong.installation_reported";
    readonly referralApplied: "goalong.referral_applied";
    readonly referralOfferingKey: "goalong.referral_offering_key";
    readonly rcAppUserId: "goalong.rc_app_user_id";
};
/** メモリだけに保存する(テスト用。アプリを終了すると消える) */
export declare function memoryStorage(): GoAlongStorage;
/** UUID v4(小文字) */
export declare function uuidv4(): string;

"use strict";
// 端末に保存する値(キー名は iOS SDK と同じ)。既定は AsyncStorage。テスト・独自実装のため差し替え可能
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYS = void 0;
exports.memoryStorage = memoryStorage;
exports.defaultStorage = defaultStorage;
exports.uuidv4 = uuidv4;
exports.KEYS = {
    installationId: "goalong.installation_id",
    installationReported: "goalong.installation_reported",
    referralApplied: "goalong.referral_applied",
    referralOfferingKey: "goalong.referral_offering_key",
    rcAppUserId: "goalong.rc_app_user_id",
};
/** メモリだけに保存する(AsyncStorage が無い場合の代替。アプリを終了すると消える) */
function memoryStorage() {
    const map = new Map();
    return {
        async getItem(k) {
            return map.get(k) ?? null;
        },
        async setItem(k, v) {
            map.set(k, v);
        },
        async removeItem(k) {
            map.delete(k);
        },
    };
}
/** @react-native-async-storage/async-storage があればそれを使う */
function defaultStorage() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require("@react-native-async-storage/async-storage");
        const AsyncStorage = (mod?.default ?? mod);
        if (AsyncStorage && typeof AsyncStorage.getItem === "function")
            return AsyncStorage;
    }
    catch {
        // 未導入
    }
    console.warn("[GoAlong] @react-native-async-storage/async-storage が見つからないため、メモリに保存します(アプリを終了するとインストール ID が変わります)。");
    return memoryStorage();
}
/** UUID v4(小文字) */
function uuidv4() {
    const bytes = new Uint8Array(16);
    const c = globalThis.crypto;
    if (c?.getRandomValues)
        c.getRandomValues(bytes);
    else
        for (let i = 0; i < 16; i++)
            bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

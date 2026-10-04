// 端末に保存する値(キー名は iOS SDK と同じ)。保存先はアプリが configure で渡す
// (AsyncStorage・MMKV・expo-secure-store など。SDK はネイティブモジュールに依存しない)

export interface GoAlongStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const KEYS = {
  installationId: "goalong.installation_id",
  installationReported: "goalong.installation_reported",
  referralApplied: "goalong.referral_applied",
  referralOfferingKey: "goalong.referral_offering_key",
  rcAppUserId: "goalong.rc_app_user_id",
} as const;

/** メモリだけに保存する(テスト用。アプリを終了すると消える) */
export function memoryStorage(): GoAlongStorage {
  const map = new Map<string, string>();
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

/** UUID v4(小文字) */
export function uuidv4(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

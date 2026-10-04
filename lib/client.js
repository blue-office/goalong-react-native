"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoAlong = exports.SDK_VERSION = void 0;
exports.__resetForTesting = __resetForTesting;
// GoAlong SDK の中核(サーバー API・端末の保存)。React Native に依存しない部分
const link_1 = require("./link");
const models_1 = require("./models");
const storage_1 = require("./storage");
exports.SDK_VERSION = "react-native-0.2.0";
let state = null;
let entryCache = null;
// 端末の保存状態を変える操作(適用・状態取得・取り消し・特典の受け取り)は 1 つずつ実行する。
// 遅れて返った古い応答が、あとから成功した操作の保存状態を上書きしないように
let queue = Promise.resolve();
function serial(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
}
function fallbackStorage() {
    console.warn("[GoAlong] configure に storage が渡されていないため、メモリに保存します(アプリを終了するとインストール ID が変わります)。");
    return (0, storage_1.memoryStorage)();
}
function defaultDeviceMeta() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Platform } = require("react-native");
        const locale = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale : undefined;
        return { osVersion: `${Platform.OS} ${String(Platform.Version)}`, locale };
    }
    catch {
        return {};
    }
}
function require_() {
    if (!state)
        throw new models_1.GoAlongError("notConfigured", "GoAlong.configure() を先に呼んでください");
    return state;
}
async function request(method, path, body) {
    const s = require_();
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 15000) : null;
    let res;
    try {
        res = await s.fetch(`${s.baseUrl}${path}`, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller?.signal,
        });
    }
    catch (e) {
        throw new models_1.GoAlongError("network", e instanceof Error ? e.message : undefined);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
    if (res.status < 200 || res.status > 299) {
        throw new models_1.GoAlongError("server", `HTTP ${res.status}`, res.status);
    }
    try {
        return (await res.json());
    }
    catch {
        throw new models_1.GoAlongError("network", "invalid_json");
    }
}
function withMeta(body) {
    const meta = require_().deviceMeta();
    return { ...body, sdkVersion: exports.SDK_VERSION, ...meta };
}
// 初回起動の登録と、アプリからの呼び出しが同時に走っても ID を 1 つにする
let installationIdPromise = null;
function installationIdOf(storage) {
    if (installationIdPromise?.storage === storage)
        return installationIdPromise.promise;
    const promise = (async () => {
        const existing = await storage.getItem(storage_1.KEYS.installationId);
        if (existing)
            return existing;
        const generated = (0, storage_1.uuidv4)();
        await storage.setItem(storage_1.KEYS.installationId, generated);
        return generated;
    })();
    installationIdPromise = { storage, promise };
    promise.catch(() => {
        if (installationIdPromise?.promise === promise)
            installationIdPromise = null;
    });
    return promise;
}
async function reportInstallationIfNeeded() {
    const s = require_();
    if ((await s.storage.getItem(storage_1.KEYS.installationReported)) === "1")
        return;
    const id = await installationIdOf(s.storage);
    try {
        const res = await request("POST", "/api/sdk/v1/installations", withMeta({ appId: s.appId, installationId: id }));
        if (res.ok)
            await s.storage.setItem(storage_1.KEYS.installationReported, "1");
    }
    catch {
        // 次回の起動で再送する
    }
}
/** 付与された特典(サーバーの perk)。perkLabel だけでは付与されていない(付与予定・付与失敗) */
function toPerk(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const p = raw;
    if (!p.label)
        return null;
    return { label: p.label, entitlement: p.entitlement, duration: p.duration, expiresAtMs: p.expiresAtMs ?? null };
}
/** 適用済みを保存。offering はコードごとに置き換える(offering なしのコードに変えたら古い値を消す) */
async function markApplied(offeringKey) {
    const s = require_();
    await s.storage.setItem(storage_1.KEYS.referralApplied, "1");
    if (offeringKey)
        await s.storage.setItem(storage_1.KEYS.referralOfferingKey, offeringKey);
    else
        await s.storage.removeItem(storage_1.KEYS.referralOfferingKey);
}
async function clearApplied() {
    const s = require_();
    await s.storage.removeItem(storage_1.KEYS.referralApplied);
    await s.storage.removeItem(storage_1.KEYS.referralOfferingKey);
}
/** GoAlong SDK(React Native) */
exports.GoAlong = {
    /** 起動時に 1 回呼ぶ。初回起動の登録は裏で行う */
    configure(config) {
        const baseUrl = (config.baseUrl ?? "https://goalong.me").replace(/\/+$/, "");
        const host = baseUrl.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
        state = {
            appId: config.appId,
            appSlug: config.appSlug,
            baseUrl,
            host,
            storage: config.storage ?? fallbackStorage(),
            isActiveSubscriber: config.isActiveSubscriber,
            deviceMeta: config.deviceMeta ?? defaultDeviceMeta,
            fetch: config.fetch ?? fetch,
        };
        entryCache = null;
        void reportInstallationIfNeeded();
    },
    /** この端末の GoAlong のインストール ID */
    async installationId() {
        return installationIdOf(require_().storage);
    },
    /**
     * RevenueCat のユーザー ID を渡す(Purchases.configure の直後・ログインなどでユーザーが変わったとき)。
     * 紹介が適用済みなら、まだ付いていないユーザー特典を取りに行き、付与された特典を返す
     */
    async setRevenueCatUserID(rcAppUserId) {
        const s = require_();
        await s.storage.setItem(storage_1.KEYS.rcAppUserId, rcAppUserId);
        return serial(async () => {
            if ((await s.storage.getItem(storage_1.KEYS.referralApplied)) !== "1")
                return null;
            try {
                const res = await request("POST", "/api/sdk/v1/perks/claim", { appId: s.appId, installationId: await installationIdOf(s.storage), rcAppUserId });
                if (res.status === "no_attribution") {
                    await clearApplied();
                    return null;
                }
                // offering はサーバーの最新の内容に置き換える(キャンペーンの特典が変わった場合に古い値を残さない)
                if (res.status === "granted" || res.status === "no_perk") {
                    if (res.offeringKey)
                        await s.storage.setItem(storage_1.KEYS.referralOfferingKey, res.offeringKey);
                    else
                        await s.storage.removeItem(storage_1.KEYS.referralOfferingKey);
                }
                return res.status === "granted" ? toPerk(res.perk) : null;
            }
            catch {
                return null;
            }
        });
    },
    /**
     * RevenueCat の Subscriber Attributes に渡す属性。
     * `Purchases.setAttributes(await GoAlong.attributionAttributes())` を購入より前に呼ぶ
     */
    async attributionAttributes() {
        const s = require_();
        const attrs = { goalong_installation_id: await installationIdOf(s.storage) };
        const offering = await s.storage.getItem(storage_1.KEYS.referralOfferingKey);
        if (offering) {
            attrs.goalong_referred = "true";
            attrs.goalong_offering = offering;
        }
        else if ((await s.storage.getItem(storage_1.KEYS.referralApplied)) === "1") {
            attrs.goalong_referred = "true";
        }
        return attrs;
    },
    /** setRevenueCatUserID で ID を受け取っているか */
    async hasRevenueCatUserID() {
        return Boolean(await require_().storage.getItem(storage_1.KEYS.rcAppUserId));
    },
    /** この端末で紹介が適用済みか(サーバーに問い合わせない) */
    async hasAppliedReferralLocally() {
        return (await require_().storage.getItem(storage_1.KEYS.referralApplied)) === "1";
    },
    /** 適用せずに検証する(紹介者の名前の確認など) */
    async validateCode(code) {
        const s = require_();
        // 紹介リンクならコードを取り出す。形式に合わない入力(無関係な URL など)はサーバーに送らない
        const fromLink = code.includes("://") ? exports.GoAlong.extractCode(code) : null;
        const normalized = fromLink ?? (0, link_1.normalizeCode)(code);
        if (!link_1.CODE_PATTERN.test(normalized))
            return { valid: false, error: "invalid_format" };
        code = normalized;
        const res = await request("POST", "/api/sdk/v1/codes/validate", { appId: s.appId, code: (0, link_1.normalizeCode)(code) });
        if (!res.valid)
            return { valid: false, error: res.error ?? "not_found" };
        return { valid: true, code: res.code ?? (0, link_1.normalizeCode)(code), creator: res.creator ?? null, perk: toPerk(res.perk) };
    },
    /**
     * コードを適用する。rcAppUserId を省略すると setRevenueCatUserID で受け取った ID を使う。
     * conflict(別の紹介者のコードを適用済み)のときは、ユーザーに確認してから confirmReplace: true で再実行する
     */
    async applyCode(code, options = {}) {
        require_();
        return serial(() => applyCodeNow(code, options));
    },
    /** いまの紹介の状態 */
    async currentReferral() {
        require_();
        return serial(currentReferralNow);
    },
    /** 紹介を取り消す(以後の課金は紹介に結び付かない。受け取り済みの特典は期限まで使える) */
    async removeReferral() {
        require_();
        return serial(removeReferralNow);
    },
    /** 紹介リンク(https://goalong.me/{appSlug}/{CODE})からコードを取り出す。適用はしない */
    handleDeepLink(url) {
        const s = state;
        return (0, link_1.extractCodeFromUrl)(url, { host: s?.host ?? "goalong.me", appSlug: s?.appSlug });
    },
    /** 入力された文字列が紹介リンクなら、コードを取り出す */
    extractCode(text) {
        const s = state;
        return (0, link_1.extractCodeFromText)(text, { host: s?.host ?? "goalong.me", appSlug: s?.appSlug });
    },
    /** 紹介コードの入口を出してよいか(使える紹介コードがあるか)。サーバーの指定する時間だけキャッシュする */
    async referralEntryEnabled() {
        const s = require_();
        if (entryCache && entryCache.until > Date.now())
            return entryCache.enabled;
        try {
            const res = await request("GET", `/api/sdk/v1/config?appId=${encodeURIComponent(s.appId)}`);
            entryCache = { enabled: res.entryEnabled === true, until: Date.now() + (res.cacheMaxAgeSeconds ?? 900) * 1000 };
            return entryCache.enabled;
        }
        catch {
            return false;
        }
    },
};
async function applyCodeNow(code, options) {
    const s = require_();
    const normalized = (0, link_1.normalizeCode)(code);
    if (!link_1.CODE_PATTERN.test(normalized))
        return { type: "notFound", error: "invalid_format" };
    // 判定に失敗したときは続行する(rcAppUserId があればサーバーでも再判定する)
    if (s.isActiveSubscriber && (await s.isActiveSubscriber().catch(() => false))) {
        return { type: "existingSubscriber" };
    }
    const rcAppUserId = options.rcAppUserId ?? (await s.storage.getItem(storage_1.KEYS.rcAppUserId)) ?? undefined;
    const res = await request("POST", "/api/sdk/v1/codes/apply", withMeta({
        appId: s.appId,
        installationId: await installationIdOf(s.storage),
        code: normalized,
        method: options.method ?? "CODE",
        ...(rcAppUserId ? { rcAppUserId } : {}),
        confirmReplace: options.confirmReplace === true,
    }));
    switch (res.status) {
        case "applied":
            await markApplied(res.offeringKey);
            return {
                type: "applied",
                creator: res.creator ?? null,
                perk: toPerk(res.perk),
                perkLabel: res.perkLabel ?? null,
                offeringKey: res.offeringKey ?? null,
            };
        case "already_applied":
            await markApplied(res.offeringKey);
            return {
                type: "alreadyApplied",
                creator: res.creator ?? null,
                perk: toPerk(res.perk),
                perkLabel: res.perkLabel ?? null,
                offeringKey: res.offeringKey ?? null,
            };
        case "conflict":
            return { type: "conflict", currentCreator: res.currentCreator ?? null };
        case "existing_subscriber":
            return { type: "existingSubscriber" };
        case "expired":
            return { type: "notFound", error: "expired" };
        default:
            return { type: "notFound", error: res.error ?? null };
    }
}
async function currentReferralNow() {
    const s = require_();
    const id = await installationIdOf(s.storage);
    const res = await request("GET", `/api/sdk/v1/codes/current?appId=${encodeURIComponent(s.appId)}&installationId=${encodeURIComponent(id)}`);
    // サーバーの状態で端末の適用済みフラグを合わせる(適用の応答が失われた場合などの復旧)
    if (res.status === "applied")
        await s.storage.setItem(storage_1.KEYS.referralApplied, "1");
    else
        await clearApplied();
    if (res.status === "applied") {
        return {
            type: "applied",
            creator: res.creator ?? null,
            appliedAt: res.appliedAt ? new Date(res.appliedAt) : null,
            perk: toPerk(res.perk),
        };
    }
    if (res.status === "removed")
        return { type: "removed", removedAt: res.removedAt ? new Date(res.removedAt) : null };
    return { type: "none" };
}
async function removeReferralNow() {
    const s = require_();
    const res = await request("POST", "/api/sdk/v1/codes/remove", {
        appId: s.appId,
        installationId: await installationIdOf(s.storage),
    });
    // no_attribution(サーバーではすでに取り消し済み。前回の応答が失われた再試行など)でも端末の状態を消す
    if (res.status === "removed" || res.status === "no_attribution")
        await clearApplied();
    return res.status === "removed";
}
/** テスト用: 設定とキャッシュを消す */
function __resetForTesting() {
    state = null;
    queue = Promise.resolve();
    entryCache = null;
    installationIdPromise = null;
}

"use strict";
// 紹介コードの正規化と、紹介リンクからのコード抽出(iOS SDK と同じ規則)
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_PATTERN = void 0;
exports.normalizeCode = normalizeCode;
exports.extractCodeFromUrl = extractCodeFromUrl;
exports.extractCodeFromText = extractCodeFromText;
exports.CODE_PATTERN = /^[A-Z0-9]{3,20}$/;
/** NFKC(全角の救済)+ 前後の空白除去 + 大文字化 */
function normalizeCode(raw) {
    const s = typeof raw.normalize === "function" ? raw.normalize("NFKC") : raw;
    return s.trim().toUpperCase();
}
/**
 * 正規の紹介リンク(https://goalong.me/{appSlug}/{CODE})からだけコードを取り出す。
 * 無関係な URL の末尾をコードとしてサーバーへ送らないよう厳格に判定する:
 * https のみ / ユーザー情報・ポートなし / 許可ホスト / パスがちょうど 2 要素 / slug 一致
 */
function extractCodeFromUrl(url, rules) {
    const m = /^https:\/\/([^/?#]+)(\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i.exec(url.trim());
    if (!m)
        return null;
    const authority = m[1];
    // ポート・ユーザー情報・エスケープ・バックスラッシュ・空白を含むホスト表記は認めない
    if (/[:@%\\\s]/.test(authority))
        return null;
    const host = authority.toLowerCase();
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/.test(host))
        return null;
    const expected = rules.host.toLowerCase();
    if (host !== expected && !host.endsWith("." + expected))
        return null;
    // パスはちょうど /{slug}/{code}(空の要素・末尾のスラッシュ・3 要素以上は不可)
    const parts = (m[2] ?? "").split("/");
    if (parts.length !== 3 || parts[0] !== "" || parts[1] === "" || parts[2] === "")
        return null;
    let slug;
    let rawCode;
    try {
        slug = decodeURIComponent(parts[1]);
        rawCode = decodeURIComponent(parts[2]);
    }
    catch {
        return null;
    }
    if (slug === "." || slug === ".." || /[/\\]/.test(slug))
        return null;
    if (rules.appSlug && slug.toLowerCase() !== rules.appSlug.toLowerCase())
        return null;
    const candidate = normalizeCode(rawCode);
    return exports.CODE_PATTERN.test(candidate) ? candidate : null;
}
/** 入力欄の文字列から: URL なら抽出、そうでなければ null */
function extractCodeFromText(text, rules) {
    const t = text.trim();
    if (!/^https?:\/\//i.test(t))
        return null;
    return extractCodeFromUrl(t, rules);
}

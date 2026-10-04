export declare const CODE_PATTERN: RegExp;
/** NFKC(全角の救済)+ 前後の空白除去 + 大文字化 */
export declare function normalizeCode(raw: string): string;
export interface LinkRules {
    /** 紹介リンクのホスト(既定 goalong.me)。サブドメインも認める */
    host: string;
    /** 設定されていれば、パスの 1 要素目と一致すること */
    appSlug?: string;
}
/**
 * 正規の紹介リンク(https://goalong.me/{appSlug}/{CODE})からだけコードを取り出す。
 * 無関係な URL の末尾をコードとしてサーバーへ送らないよう厳格に判定する:
 * https のみ / ユーザー情報・ポートなし / 許可ホスト / パスがちょうど 2 要素 / slug 一致
 */
export declare function extractCodeFromUrl(url: string, rules: LinkRules): string | null;
/** 入力欄の文字列から: URL なら抽出、そうでなければ null */
export declare function extractCodeFromText(text: string, rules: LinkRules): string | null;

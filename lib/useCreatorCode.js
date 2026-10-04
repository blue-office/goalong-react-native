"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCreatorCode = useCreatorCode;
exports.useCurrentReferral = useCurrentReferral;
// 紹介コード入力の状態(headless)。既成 UI(CreatorCodeInput)もこれを使う。iOS の CreatorCodeModel と同じ流れ:
// 入力 → 形式に合えば少し待って検証(valid: 特典のプレビュー)→「このコードを使う」で適用。紹介リンクの貼り付けは自動で適用
const react_1 = require("react");
const client_1 = require("./client");
const link_1 = require("./link");
function failureOf(error) {
    if (error === "invalid_format")
        return { kind: "invalidFormat" };
    if (error === "expired")
        return { kind: "expired" };
    return { kind: "notFound" };
}
const VALIDATE_DELAY_MS = 400;
function useCreatorCode(options = {}) {
    const [code, setCodeState] = (0, react_1.useState)("");
    const [phase, setPhase] = (0, react_1.useState)({ type: "idle" });
    const onApplied = (0, react_1.useRef)(options.onApplied);
    onApplied.current = options.onApplied;
    const seq = (0, react_1.useRef)(0);
    /** 検証で分かった特典(付与されたかどうかの判断に使う) */
    const validatedPerk = (0, react_1.useRef)(null);
    const apply = (0, react_1.useCallback)(async (opts = {}) => {
        const target = (0, link_1.normalizeCode)(opts.code ?? code);
        const my = ++seq.current;
        setPhase({ type: "applying" });
        try {
            const res = await client_1.GoAlong.applyCode(target, {
                method: opts.method ?? "CODE",
                rcAppUserId: options.rcAppUserId,
                confirmReplace: opts.confirmReplace,
            });
            if (my !== seq.current)
                return;
            switch (res.type) {
                case "applied":
                case "alreadyApplied": {
                    // 特典があるコードなのに付与されておらず、RevenueCat のユーザー ID がまだ分からない(未ログイン)
                    // ときだけ「ログイン後に受け取れます」。ID があるのに付与されていない場合は案内しない
                    const hasCodePerk = Boolean(res.perkLabel) || validatedPerk.current != null;
                    const knowsUser = Boolean(options.rcAppUserId) || (await client_1.GoAlong.hasRevenueCatUserID());
                    const pending = !res.perk && hasCodePerk && !knowsUser;
                    setPhase({ type: "done", perk: res.perk, perkPending: pending });
                    onApplied.current?.(res.perk);
                    return;
                }
                case "conflict":
                    setPhase({ type: "failed", failure: { kind: "conflict" } });
                    return;
                case "existingSubscriber":
                    setPhase({ type: "failed", failure: { kind: "existingSubscriber" } });
                    return;
                case "notFound":
                    setPhase({ type: "failed", failure: failureOf(res.error) });
                    return;
            }
        }
        catch {
            if (my === seq.current)
                setPhase({ type: "failed", failure: { kind: "network" } });
        }
    }, [code, options.rcAppUserId]);
    /** 入力。紹介リンクが貼られたらコードを取り出し、検証(特典の確認)してから自動で適用する */
    const setCode = (0, react_1.useCallback)((text) => {
        validatedPerk.current = null;
        const fromLink = text.includes("://") ? client_1.GoAlong.extractCode(text) : null;
        if (fromLink) {
            setCodeState(fromLink);
            const my = ++seq.current;
            setPhase({ type: "checking" });
            void (async () => {
                try {
                    const v = await client_1.GoAlong.validateCode(fromLink);
                    if (my !== seq.current)
                        return;
                    if (!v.valid) {
                        setPhase({ type: "failed", failure: failureOf(v.error) });
                        return;
                    }
                    validatedPerk.current = v.perk;
                    await apply({ code: fromLink, method: "CLIPBOARD" });
                }
                catch {
                    if (my === seq.current)
                        setPhase({ type: "failed", failure: { kind: "network" } });
                }
            })();
            return;
        }
        setCodeState(text);
        seq.current++;
        setPhase({ type: "idle" });
    }, [apply]);
    /** キーボードの確定。形式に合わなければ形式エラーを出す(サーバーには送らない) */
    const submit = (0, react_1.useCallback)(() => {
        if (!link_1.CODE_PATTERN.test((0, link_1.normalizeCode)(code))) {
            seq.current++;
            setPhase({ type: "failed", failure: { kind: "invalidFormat" } });
            return;
        }
        if (phase.type === "valid")
            void apply();
    }, [code, phase.type, apply]);
    // 形式に合うコードは、少し待ってから検証する(特典のプレビュー)。合わない入力は送信せず形式エラーを出す
    (0, react_1.useEffect)(() => {
        if (phase.type !== "idle")
            return;
        const normalized = (0, link_1.normalizeCode)(code);
        if (!normalized)
            return;
        if (!link_1.CODE_PATTERN.test(normalized)) {
            // 紹介リンク以外の URL などはサーバーへ送らない。入力途中(短いだけ)ではエラーを出さない
            if (!/[^A-Z0-9]/.test(normalized) && normalized.length < 3)
                return;
            const timer = setTimeout(() => setPhase({ type: "failed", failure: { kind: "invalidFormat" } }), VALIDATE_DELAY_MS * 2);
            return () => clearTimeout(timer);
        }
        const my = ++seq.current;
        const timer = setTimeout(async () => {
            setPhase({ type: "checking" });
            try {
                const v = await client_1.GoAlong.validateCode(normalized);
                if (my !== seq.current)
                    return;
                validatedPerk.current = v.valid ? v.perk : null;
                setPhase(v.valid ? { type: "valid", perk: v.perk } : { type: "failed", failure: failureOf(v.error) });
            }
            catch {
                if (my === seq.current)
                    setPhase({ type: "failed", failure: { kind: "network" } });
            }
        }, VALIDATE_DELAY_MS);
        return () => clearTimeout(timer);
    }, [code, phase.type]);
    const retry = (0, react_1.useCallback)(() => {
        seq.current++;
        setPhase({ type: "idle" });
    }, []);
    return {
        code,
        setCode,
        phase,
        /** 「このコードを使う」 */
        apply: () => apply(),
        /** conflict のとき「このコードに変更する」 */
        replace: () => apply({ confirmReplace: true }),
        retry,
        /** キーボードの確定(形式エラーの表示・valid なら適用) */
        submit,
        /** 入力形式のエラー(形式に合わない入力で確定しようとしたとき用) */
        isValidFormat: link_1.CODE_PATTERN.test((0, link_1.normalizeCode)(code)),
    };
}
/** 表示時点の紹介の状態(適用済みなら入力欄の代わりに状態を出す) */
function useCurrentReferral() {
    const [state, setState] = (0, react_1.useState)({ type: "loading" });
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        client_1.GoAlong.currentReferral()
            .then((s) => {
            if (cancelled)
                return;
            if (s.type === "applied")
                setState({ type: "applied", perk: s.perk });
            else
                setState({ type: s.type });
        })
            .catch(() => !cancelled && setState({ type: "none" }));
        return () => {
            cancelled = true;
        };
    }, []);
    return state;
}

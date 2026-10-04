// 紹介コード入力の状態(headless)。既成 UI(CreatorCodeInput)もこれを使う。iOS の CreatorCodeModel と同じ流れ:
// 入力 → 形式に合えば少し待って検証(valid: 特典のプレビュー)→「このコードを使う」で適用。紹介リンクの貼り付けは自動で適用
import { useCallback, useEffect, useRef, useState } from "react";
import { GoAlong } from "./client";
import { CODE_PATTERN, normalizeCode } from "./link";
import type { ApplyMethod, CodeErrorKind, GoAlongPerk } from "./models";

export type CreatorCodeFailure =
  | { kind: "invalidFormat" }
  | { kind: "notFound" }
  | { kind: "expired" }
  | { kind: "existingSubscriber" }
  | { kind: "conflict" }
  | { kind: "network" };

export type CreatorCodePhase =
  | { type: "idle" }
  | { type: "checking" }
  | { type: "valid"; perk: GoAlongPerk | null }
  | { type: "applying" }
  /** perkPending: 特典は RevenueCat のユーザー ID が分かったあと(ログイン後)に付与される */
  | { type: "done"; perk: GoAlongPerk | null; perkPending: boolean }
  | { type: "failed"; failure: CreatorCodeFailure };

function failureOf(error: CodeErrorKind | null): CreatorCodeFailure {
  if (error === "invalid_format") return { kind: "invalidFormat" };
  if (error === "expired") return { kind: "expired" };
  return { kind: "notFound" };
}

const VALIDATE_DELAY_MS = 400;

export function useCreatorCode(
  options: { rcAppUserId?: string; onApplied?: (perk: GoAlongPerk | null) => void } = {},
) {
  const [code, setCodeState] = useState("");
  const [phase, setPhase] = useState<CreatorCodePhase>({ type: "idle" });
  const onApplied = useRef(options.onApplied);
  onApplied.current = options.onApplied;
  const seq = useRef(0);
  /** 検証で分かった特典(付与されたかどうかの判断に使う) */
  const validatedPerk = useRef<GoAlongPerk | null>(null);

  const apply = useCallback(
    async (opts: { code?: string; method?: ApplyMethod; confirmReplace?: boolean } = {}) => {
      const target = normalizeCode(opts.code ?? code);
      const my = ++seq.current;
      setPhase({ type: "applying" });
      try {
        const res = await GoAlong.applyCode(target, {
          method: opts.method ?? "CODE",
          rcAppUserId: options.rcAppUserId,
          confirmReplace: opts.confirmReplace,
        });
        if (my !== seq.current) return;
        switch (res.type) {
          case "applied":
          case "alreadyApplied": {
            // 特典があるコードなのに付与されておらず、RevenueCat のユーザー ID がまだ分からない(未ログイン)
            // ときだけ「ログイン後に受け取れます」。ID があるのに付与されていない場合は案内しない
            const hasCodePerk = Boolean(res.perkLabel) || validatedPerk.current != null;
            const knowsUser = Boolean(options.rcAppUserId) || (await GoAlong.hasRevenueCatUserID());
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
      } catch {
        if (my === seq.current) setPhase({ type: "failed", failure: { kind: "network" } });
      }
    },
    [code, options.rcAppUserId],
  );

  /** 入力。紹介リンクが貼られたらコードを取り出し、検証(特典の確認)してから自動で適用する */
  const setCode = useCallback(
    (text: string) => {
      validatedPerk.current = null;
      const fromLink = text.includes("://") ? GoAlong.extractCode(text) : null;
      if (fromLink) {
        setCodeState(fromLink);
        const my = ++seq.current;
        setPhase({ type: "checking" });
        void (async () => {
          try {
            const v = await GoAlong.validateCode(fromLink);
            if (my !== seq.current) return;
            if (!v.valid) {
              setPhase({ type: "failed", failure: failureOf(v.error) });
              return;
            }
            validatedPerk.current = v.perk;
            await apply({ code: fromLink, method: "CLIPBOARD" });
          } catch {
            if (my === seq.current) setPhase({ type: "failed", failure: { kind: "network" } });
          }
        })();
        return;
      }
      setCodeState(text);
      seq.current++;
      setPhase({ type: "idle" });
    },
    [apply],
  );

  /** キーボードの確定。形式に合わなければ形式エラーを出す(サーバーには送らない) */
  const submit = useCallback(() => {
    if (!CODE_PATTERN.test(normalizeCode(code))) {
      seq.current++;
      setPhase({ type: "failed", failure: { kind: "invalidFormat" } });
      return;
    }
    if (phase.type === "valid") void apply();
  }, [code, phase.type, apply]);

  // 形式に合うコードは、少し待ってから検証する(特典のプレビュー)。合わない入力は送信せず形式エラーを出す
  useEffect(() => {
    if (phase.type !== "idle") return;
    const normalized = normalizeCode(code);
    if (!normalized) return;
    if (!CODE_PATTERN.test(normalized)) {
      // 紹介リンク以外の URL などはサーバーへ送らない。入力途中(短いだけ)ではエラーを出さない
      if (!/[^A-Z0-9]/.test(normalized) && normalized.length < 3) return;
      const timer = setTimeout(() => setPhase({ type: "failed", failure: { kind: "invalidFormat" } }), VALIDATE_DELAY_MS * 2);
      return () => clearTimeout(timer);
    }
    const my = ++seq.current;
    const timer = setTimeout(async () => {
      setPhase({ type: "checking" });
      try {
        const v = await GoAlong.validateCode(normalized);
        if (my !== seq.current) return;
        validatedPerk.current = v.valid ? v.perk : null;
        setPhase(v.valid ? { type: "valid", perk: v.perk } : { type: "failed", failure: failureOf(v.error) });
      } catch {
        if (my === seq.current) setPhase({ type: "failed", failure: { kind: "network" } });
      }
    }, VALIDATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [code, phase.type]);

  const retry = useCallback(() => {
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
    isValidFormat: CODE_PATTERN.test(normalizeCode(code)),
  };
}

export type CurrentReferralState =
  | { type: "loading" }
  | { type: "none" }
  | { type: "applied"; perk: GoAlongPerk | null }
  | { type: "removed" };

/** 表示時点の紹介の状態(適用済みなら入力欄の代わりに状態を出す) */
export function useCurrentReferral(): CurrentReferralState {
  const [state, setState] = useState<CurrentReferralState>({ type: "loading" });
  useEffect(() => {
    let cancelled = false;
    GoAlong.currentReferral()
      .then((s) => {
        if (cancelled) return;
        if (s.type === "applied") setState({ type: "applied", perk: s.perk });
        else setState({ type: s.type });
      })
      .catch(() => !cancelled && setState({ type: "none" }));
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

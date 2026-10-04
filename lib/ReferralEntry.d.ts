import React from "react";
import { type CreatorCodeInputProps } from "./CreatorCodeInput";
export interface ReferralEntryProps extends CreatorCodeInputProps {
    /**
     * クリップボードの文字列を返す関数(例: expo-clipboard の Clipboard.getStringAsync)。
     * 渡したときだけ、紹介リンクがコピーされているかを確認する
     */
    getClipboardText?: () => Promise<string | null | undefined>;
}
export declare function ReferralEntry({ getClipboardText, ...inputProps }: ReferralEntryProps): React.JSX.Element | null;

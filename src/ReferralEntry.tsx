// 初回画面に置く紹介コードの入口。状況に応じて出し方を変える:
// 適用済みなら何も出さない → クリップボードに紹介リンクがあれば入力欄を開いて表示 →
// 使える紹介コードがあるときだけ小さな入口(タップで入力欄を開く)
import React from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { GoAlong } from "./client";
import { CreatorCodeInput, type CreatorCodeInputProps } from "./CreatorCodeInput";
import { darkTheme, defaultLabels, lightTheme } from "./theme";

export interface ReferralEntryProps extends CreatorCodeInputProps {
  /**
   * クリップボードの文字列を返す関数(例: expo-clipboard の Clipboard.getStringAsync)。
   * 渡したときだけ、紹介リンクがコピーされているかを確認する
   */
  getClipboardText?: () => Promise<string | null | undefined>;
}

export function ReferralEntry({ getClipboardText, ...inputProps }: ReferralEntryProps) {
  const scheme = useColorScheme();
  const t = { ...(scheme === "dark" ? darkTheme : lightTheme), ...inputProps.theme };
  const l = { ...defaultLabels, ...inputProps.labels };
  const [mode, setMode] = React.useState<"hidden" | "prompt" | "open">("hidden");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (await GoAlong.hasAppliedReferralLocally()) return;
      if (getClipboardText) {
        const text = await getClipboardText().catch(() => null);
        if (text && GoAlong.extractCode(text)) {
          if (!cancelled) setMode("open");
          return;
        }
      }
      if (await GoAlong.referralEntryEnabled()) {
        if (!cancelled) setMode("prompt");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getClipboardText]);

  if (mode === "hidden") return null;
  if (mode === "prompt") {
    return (
      <Pressable onPress={() => setMode("open")} accessibilityRole="button" style={{ paddingVertical: 8 }}>
        <Text style={{ color: t.secondaryText, textDecorationLine: "underline" }}>{l.entryPrompt}</Text>
      </Pressable>
    );
  }
  return (
    <View>
      <CreatorCodeInput {...inputProps} />
    </View>
  );
}

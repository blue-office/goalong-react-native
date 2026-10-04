// 紹介コードの入力欄(既成 UI)。iOS SDK の CreatorCodeInputView と同じ動き・文言。
// 誰の紹介かはユーザーに見せない(紹介者名は表示しない)。取り消しは API(GoAlong.removeReferral)のみ
import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { useCreatorCode, useCurrentReferral } from "./useCreatorCode";
import { darkTheme, defaultLabels, fill, formatDate, lightTheme, type GoAlongLabels, type GoAlongTheme } from "./theme";
import type { GoAlongPerk } from "./models";

export interface CreatorCodeInputProps {
  /** RevenueCat の appUserID(setRevenueCatUserID 済みなら省略可) */
  rcAppUserId?: string;
  /** 適用が完了したとき(perk = 付与された特典。RevenueCat の属性を設定し直すのに使う) */
  onApplied?: (perk: GoAlongPerk | null) => void;
  /** 指定すると「あとで」を表示 */
  onSkip?: () => void;
  theme?: Partial<GoAlongTheme>;
  labels?: Partial<GoAlongLabels>;
}

export function CreatorCodeInput(props: CreatorCodeInputProps) {
  const scheme = useColorScheme();
  const t: GoAlongTheme = { ...(scheme === "dark" ? darkTheme : lightTheme), ...props.theme };
  const l: GoAlongLabels = { ...defaultLabels, ...props.labels };
  const current = useCurrentReferral();
  const { code, setCode, phase, apply, replace, retry, submit } = useCreatorCode({
    rcAppUserId: props.rcAppUserId,
    onApplied: props.onApplied,
  });

  const card = (title: string, detail?: string | null) => (
    <View style={{ backgroundColor: t.cardBackground, borderRadius: t.cornerRadius + 4, padding: 16 }}>
      <Text style={{ color: t.text, fontWeight: "600" }}>{title}</Text>
      {detail ? <Text style={{ color: t.secondaryText, marginTop: 4 }}>{detail}</Text> : null}
    </View>
  );
  const perkCard = (perk: GoAlongPerk) =>
    card(fill(l.perkGranted, { perk: perk.label }), perk.expiresAtMs ? fill(l.perkValidUntil, { date: formatDate(perk.expiresAtMs) }) : null);

  if (current.type === "loading") return null;
  if (phase.type === "done") {
    if (phase.perk) return perkCard(phase.perk);
    return card(l.appliedNoCreator, phase.perkPending ? l.perkPending : null);
  }
  if (current.type === "applied" && phase.type === "idle" && !code) {
    return current.perk ? perkCard(current.perk) : card(l.currentReferralNoCreator);
  }

  const busy = phase.type === "applying" || phase.type === "checking";
  const errorText =
    phase.type === "failed"
      ? {
          invalidFormat: l.errorFormat,
          notFound: l.errorNotFound,
          expired: l.errorExpired,
          existingSubscriber: l.errorExistingSubscriber,
          network: l.errorNetwork,
          conflict: l.errorConflict,
        }[phase.failure.kind]
      : null;

  const button = (label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ backgroundColor: t.accent, borderRadius: t.cornerRadius, paddingVertical: 12, alignItems: "center", marginTop: 10 }}
    >
      <Text style={{ color: t.onAccent, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );

  return (
    <View>
      <Text style={{ color: t.text, fontWeight: "600", marginBottom: 8 }}>{l.title}</Text>
      {current.type === "removed" && !code ? (
        <Text style={{ color: t.secondaryText, marginBottom: 8, fontSize: 13 }}>{l.removedNotice}</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: t.fieldBackground, borderRadius: t.cornerRadius }}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={l.placeholder}
          placeholderTextColor={t.secondaryText}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={phase.type !== "applying"}
          onSubmitEditing={submit}
          returnKeyType="done"
          style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: t.text, fontSize: 16 }}
        />
        {busy ? <ActivityIndicator style={{ marginRight: 12 }} color={t.secondaryText} /> : null}
      </View>

      {phase.type === "valid" ? (
        <View>
          {phase.perk ? (
            <Text style={{ color: t.text, fontWeight: "600", marginTop: 10 }}>{fill(l.perkPreview, { perk: phase.perk.label })}</Text>
          ) : null}
          {button(l.useThisCode, () => void apply())}
        </View>
      ) : null}

      {errorText ? <Text style={{ color: t.error, marginTop: 8 }}>{errorText}</Text> : null}
      {phase.type === "failed" && phase.failure.kind === "conflict" ? button(l.replace, () => void replace()) : null}
      {phase.type === "failed" && phase.failure.kind === "network" ? (
        <Pressable onPress={retry} accessibilityRole="button" style={{ marginTop: 8 }}>
          <Text style={{ color: t.secondaryText, textDecorationLine: "underline" }}>{l.retry}</Text>
        </Pressable>
      ) : null}

      {props.onSkip ? (
        <Pressable onPress={props.onSkip} accessibilityRole="button" style={{ marginTop: 12, alignSelf: "center" }}>
          <Text style={{ color: t.secondaryText }}>{l.skip}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

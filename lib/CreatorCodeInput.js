"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorCodeInput = CreatorCodeInput;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const useCreatorCode_1 = require("./useCreatorCode");
const theme_1 = require("./theme");
function CreatorCodeInput(props) {
    const scheme = (0, react_native_1.useColorScheme)();
    const t = { ...(scheme === "dark" ? theme_1.darkTheme : theme_1.lightTheme), ...props.theme };
    const l = { ...theme_1.defaultLabels, ...props.labels };
    const current = (0, useCreatorCode_1.useCurrentReferral)();
    const { code, setCode, phase, apply, replace, retry, submit } = (0, useCreatorCode_1.useCreatorCode)({
        rcAppUserId: props.rcAppUserId,
        onApplied: props.onApplied,
    });
    const card = (title, detail) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { backgroundColor: t.cardBackground, borderRadius: t.cornerRadius + 4, padding: 16 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.text, fontWeight: "600" }, children: title }), detail ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.secondaryText, marginTop: 4 }, children: detail }) : null] }));
    const perkCard = (perk) => card((0, theme_1.fill)(l.perkGranted, { perk: perk.label }), perk.expiresAtMs ? (0, theme_1.fill)(l.perkValidUntil, { date: (0, theme_1.formatDate)(perk.expiresAtMs) }) : null);
    if (current.type === "loading")
        return null;
    if (phase.type === "done") {
        if (phase.perk)
            return perkCard(phase.perk);
        return card(l.appliedNoCreator, phase.perkPending ? l.perkPending : null);
    }
    if (current.type === "applied" && phase.type === "idle" && !code) {
        return current.perk ? perkCard(current.perk) : card(l.currentReferralNoCreator);
    }
    const busy = phase.type === "applying" || phase.type === "checking";
    const errorText = phase.type === "failed"
        ? {
            invalidFormat: l.errorFormat,
            notFound: l.errorNotFound,
            expired: l.errorExpired,
            existingSubscriber: l.errorExistingSubscriber,
            network: l.errorNetwork,
            conflict: l.errorConflict,
        }[phase.failure.kind]
        : null;
    const button = (label, onPress) => ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: onPress, accessibilityRole: "button", style: { backgroundColor: t.accent, borderRadius: t.cornerRadius, paddingVertical: 12, alignItems: "center", marginTop: 10 }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.onAccent, fontWeight: "700" }, children: label }) }));
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.text, fontWeight: "600", marginBottom: 8 }, children: l.title }), current.type === "removed" && !code ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.secondaryText, marginBottom: 8, fontSize: 13 }, children: l.removedNotice })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flexDirection: "row", alignItems: "center", backgroundColor: t.fieldBackground, borderRadius: t.cornerRadius }, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: code, onChangeText: setCode, placeholder: l.placeholder, placeholderTextColor: t.secondaryText, autoCapitalize: "characters", autoCorrect: false, editable: phase.type !== "applying", onSubmitEditing: submit, returnKeyType: "done", style: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: t.text, fontSize: 16 } }), busy ? (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { style: { marginRight: 12 }, color: t.secondaryText }) : null] }), phase.type === "valid" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [phase.perk ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.text, fontWeight: "600", marginTop: 10 }, children: (0, theme_1.fill)(l.perkPreview, { perk: phase.perk.label }) })) : null, button(l.useThisCode, () => void apply())] })) : null, errorText ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.error, marginTop: 8 }, children: errorText }) : null, phase.type === "failed" && phase.failure.kind === "conflict" ? button(l.replace, () => void replace()) : null, phase.type === "failed" && phase.failure.kind === "network" ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: retry, accessibilityRole: "button", style: { marginTop: 8 }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.secondaryText, textDecorationLine: "underline" }, children: l.retry }) })) : null, props.onSkip ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: props.onSkip, accessibilityRole: "button", style: { marginTop: 12, alignSelf: "center" }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.secondaryText }, children: l.skip }) })) : null] }));
}

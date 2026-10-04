"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralEntry = ReferralEntry;
const jsx_runtime_1 = require("react/jsx-runtime");
// 初回画面に置く紹介コードの入口。状況に応じて出し方を変える:
// 適用済みなら何も出さない → クリップボードに紹介リンクがあれば入力欄を開いて表示 →
// 使える紹介コードがあるときだけ小さな入口(タップで入力欄を開く)
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const client_1 = require("./client");
const CreatorCodeInput_1 = require("./CreatorCodeInput");
const theme_1 = require("./theme");
function ReferralEntry({ getClipboardText, ...inputProps }) {
    const scheme = (0, react_native_1.useColorScheme)();
    const t = { ...(scheme === "dark" ? theme_1.darkTheme : theme_1.lightTheme), ...inputProps.theme };
    const l = { ...theme_1.defaultLabels, ...inputProps.labels };
    const [mode, setMode] = react_1.default.useState("hidden");
    react_1.default.useEffect(() => {
        let cancelled = false;
        (async () => {
            if (await client_1.GoAlong.hasAppliedReferralLocally())
                return;
            if (getClipboardText) {
                const text = await getClipboardText().catch(() => null);
                if (text && client_1.GoAlong.extractCode(text)) {
                    if (!cancelled)
                        setMode("open");
                    return;
                }
            }
            if (await client_1.GoAlong.referralEntryEnabled()) {
                if (!cancelled)
                    setMode("prompt");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [getClipboardText]);
    if (mode === "hidden")
        return null;
    if (mode === "prompt") {
        return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => setMode("open"), accessibilityRole: "button", style: { paddingVertical: 8 }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: t.secondaryText, textDecorationLine: "underline" }, children: l.entryPrompt }) }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { children: (0, jsx_runtime_1.jsx)(CreatorCodeInput_1.CreatorCodeInput, { ...inputProps }) }));
}

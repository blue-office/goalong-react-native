"use strict";
// 見た目と文言(iOS SDK と同じ既定値)。既定は控えめなモノクロ。ブランド色に合わせて差し替えられる
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLabels = exports.darkTheme = exports.lightTheme = void 0;
exports.fill = fill;
exports.formatDate = formatDate;
exports.lightTheme = {
    accent: "#111111",
    onAccent: "#FFFFFF",
    text: "#111111",
    secondaryText: "#6B6B6B",
    error: "#D92D20",
    fieldBackground: "#F2F2F2",
    cardBackground: "#F6F6F6",
    cornerRadius: 12,
};
exports.darkTheme = {
    accent: "#FFFFFF",
    onAccent: "#111111",
    text: "#FFFFFF",
    secondaryText: "#A0A0A0",
    error: "#FF6B5E",
    fieldBackground: "#1E1E1E",
    cardBackground: "#1A1A1A",
    cornerRadius: 12,
};
exports.defaultLabels = {
    title: "紹介コードをお持ちですか?",
    placeholder: "コードを入力（例: MIKA）",
    skip: "あとで",
    useThisCode: "このコードを使う",
    perkPreview: "このコードで {perk}",
    appliedNoCreator: "コードを適用しました",
    perkGranted: "{perk} が適用されました",
    perkValidUntil: "{date} まで利用できます",
    perkPending: "特典はログイン後に受け取れます",
    errorFormat: "半角英数字 3〜20 文字で入力してください",
    errorNotFound: "コードが見つかりません。入力内容を確認してください",
    errorExpired: "このコードは有効期限が切れています",
    errorExistingSubscriber: "有料プランをご契約中のため、この紹介コードはご利用いただけません",
    errorNetwork: "通信に失敗しました。時間をおいてお試しください",
    retry: "もう一度試す",
    errorConflict: "別の紹介コードが適用済みです",
    replace: "このコードに変更する",
    currentReferralNoCreator: "紹介コードは適用済みです",
    removedNotice: "紹介を取り消しました。別のコードを入力して再適用できます",
    entryPrompt: "紹介コードを入力する",
};
function fill(template, values) {
    return template.replace("{perk}", values.perk ?? "").replace("{date}", values.date ?? "");
}
function formatDate(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

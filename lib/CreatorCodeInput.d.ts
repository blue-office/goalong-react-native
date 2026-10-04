import React from "react";
import { type GoAlongLabels, type GoAlongTheme } from "./theme";
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
export declare function CreatorCodeInput(props: CreatorCodeInputProps): React.JSX.Element | null;

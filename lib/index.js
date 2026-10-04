"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLabels = exports.darkTheme = exports.lightTheme = exports.ReferralEntry = exports.CreatorCodeInput = exports.useCurrentReferral = exports.useCreatorCode = exports.normalizeCode = exports.memoryStorage = exports.SDK_VERSION = exports.GoAlong = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "GoAlong", { enumerable: true, get: function () { return client_1.GoAlong; } });
Object.defineProperty(exports, "SDK_VERSION", { enumerable: true, get: function () { return client_1.SDK_VERSION; } });
__exportStar(require("./models"), exports);
var storage_1 = require("./storage");
Object.defineProperty(exports, "memoryStorage", { enumerable: true, get: function () { return storage_1.memoryStorage; } });
var link_1 = require("./link");
Object.defineProperty(exports, "normalizeCode", { enumerable: true, get: function () { return link_1.normalizeCode; } });
var useCreatorCode_1 = require("./useCreatorCode");
Object.defineProperty(exports, "useCreatorCode", { enumerable: true, get: function () { return useCreatorCode_1.useCreatorCode; } });
Object.defineProperty(exports, "useCurrentReferral", { enumerable: true, get: function () { return useCreatorCode_1.useCurrentReferral; } });
var CreatorCodeInput_1 = require("./CreatorCodeInput");
Object.defineProperty(exports, "CreatorCodeInput", { enumerable: true, get: function () { return CreatorCodeInput_1.CreatorCodeInput; } });
var ReferralEntry_1 = require("./ReferralEntry");
Object.defineProperty(exports, "ReferralEntry", { enumerable: true, get: function () { return ReferralEntry_1.ReferralEntry; } });
var theme_1 = require("./theme");
Object.defineProperty(exports, "lightTheme", { enumerable: true, get: function () { return theme_1.lightTheme; } });
Object.defineProperty(exports, "darkTheme", { enumerable: true, get: function () { return theme_1.darkTheme; } });
Object.defineProperty(exports, "defaultLabels", { enumerable: true, get: function () { return theme_1.defaultLabels; } });

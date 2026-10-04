"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoAlongError = void 0;
class GoAlongError extends Error {
    kind;
    statusCode;
    constructor(kind, message, statusCode) {
        super(message ?? kind);
        this.name = "GoAlongError";
        this.kind = kind;
        this.statusCode = statusCode;
    }
}
exports.GoAlongError = GoAlongError;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    info(message) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    }
    error(message) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    }
    debug(message) {
        console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
    }
    warn(message) {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map
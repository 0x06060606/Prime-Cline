import { codeMode } from './prompts/system';
import { CODE_ALLOWED_TOOLS, READONLY_ALLOWED_TOOLS } from './tool-lists';
// Type guard to check if a tool is a valid tool
function isValidTool(tool) {
    return CODE_ALLOWED_TOOLS.includes(tool);
}
// Type guard to check if a tool is a read-only tool
function isReadOnlyTool(tool) {
    return READONLY_ALLOWED_TOOLS.includes(tool);
}
export function isToolAllowedForMode(toolName, mode) {
    if (mode === codeMode) {
        return isValidTool(toolName);
    }
    // Both architect and ask modes use the same read-only tools
    return isReadOnlyTool(toolName);
}
export function validateToolUse(toolName, mode) {
    if (!isToolAllowedForMode(toolName, mode)) {
        throw new Error(`Tool "${toolName}" is not allowed in ${mode} mode.`);
    }
}
//# sourceMappingURL=mode-validator.js.map
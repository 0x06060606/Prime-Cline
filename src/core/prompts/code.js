import { codeMode } from "./modes";
import { getToolDescriptionsForMode } from "./tools";
import { getRulesSection, getSystemInfoSection, getObjectiveSection, getSharedToolUseSection, getMcpServersSection, getToolUseGuidelinesSection, getCapabilitiesSection } from "./sections";
export const mode = codeMode;
export const CODE_PROMPT = async (cwd, supportsComputerUse, mcpHub, diffStrategy, browserViewportSize) => `You are Cline, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.

${getSharedToolUseSection()}

${getToolDescriptionsForMode(mode, cwd, supportsComputerUse, diffStrategy, browserViewportSize, mcpHub)}

${getToolUseGuidelinesSection()}

${await getMcpServersSection(mcpHub, diffStrategy)}

${getCapabilitiesSection(cwd, supportsComputerUse, mcpHub, diffStrategy)}

${getRulesSection(cwd, supportsComputerUse, diffStrategy)}

${getSystemInfoSection(cwd)}

${getObjectiveSection()}`;
//# sourceMappingURL=code.js.map
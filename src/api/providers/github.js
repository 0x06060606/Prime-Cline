import { githHubCopilotNativeDefaultModelId, githHubCopilotNativeModels } from "../../shared/api";
import * as vscode from 'vscode';
export class GitHubCopilotNativeHandler {
    options;
    client;
    constructor(options) {
        this.options = options;
    }
    getCopilotModel(githubCopilotModelId, callback, maxRetry = 3) {
        const llmSelector = { ...(githubCopilotModelId ? { id: githubCopilotModelId } : {}) };
        vscode.lm.selectChatModels(llmSelector)
            .then((models) => {
            if (models.length > 0) {
                callback(models[0]);
            }
            else {
                if (maxRetry > 0) {
                    this.getCopilotModel(undefined, callback, maxRetry - 1);
                }
                else {
                    callback(undefined);
                }
            }
        });
    }
    async *createMessage(systemPrompt, messages) {
        if (!vscode.lm.selectChatModels) {
            throw new Error('Language Model API not available in this version of VS Code, update it to >=1.91.0');
        }
        if (!this.client) {
            this.client = await new Promise((resolve, reject) => {
                this.getCopilotModel(this.getModel().id, (client) => {
                    if (!client) {
                        reject(new Error('No model is available from Github Copilot at this moment. Please try again later.'));
                    }
                    else {
                        resolve(client);
                    }
                });
            });
        }
        const lmChatMessages = [
            {
                role: 'user',
                content: [{ type: 'text', value: systemPrompt }],
                name: undefined
            }
        ];
        for (const message of messages) {
            if (typeof (message.content) === 'string') {
                lmChatMessages.push({
                    role: 'user',
                    content: [{ type: 'text', value: message.content }],
                    name: undefined
                });
            }
            else {
                if (message.role === 'user') {
                    for (const content of message.content) {
                        if (content.type === 'text') {
                            lmChatMessages.push({
                                role: 'user',
                                content: [{ type: 'text', value: content.text }],
                                name: undefined
                            });
                        }
                    }
                }
                else if (message.role === 'assistant') {
                    for (const content of message.content) {
                        if (content.type === 'text') {
                            lmChatMessages.push({
                                role: 'assistant',
                                content: [{ type: 'text', value: content.text }],
                                name: undefined
                            });
                        }
                    }
                }
            }
        }
        const strema = await this.client.sendRequest(lmChatMessages, {
            justification: "Cline want to use your GitHub Copilot, Click 'Allow' to share it with Cline",
            modelOptions: {
                temperature: 0,
            },
        }, new vscode.CancellationTokenSource().token);
        for await (const message of strema.stream) {
            if (message && message.value) {
                yield {
                    type: "text",
                    text: message.value
                };
            }
        }
    }
    getModel() {
        const modelId = this.options.apiModelId;
        if (modelId && modelId in githHubCopilotNativeModels) {
            const id = modelId;
            return { id, info: githHubCopilotNativeModels[id] };
        }
        return { id: githHubCopilotNativeDefaultModelId, info: githHubCopilotNativeModels[githHubCopilotNativeDefaultModelId] };
    }
}
//# sourceMappingURL=github.js.map
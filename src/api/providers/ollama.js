import OpenAI from "openai";
import { openAiModelInfoSaneDefaults } from "../../shared/api";
import { convertToOpenAiMessages } from "../transform/openai-format";
export class OllamaHandler {
    options;
    client;
    constructor(options) {
        this.options = options;
        this.client = new OpenAI({
            baseURL: (this.options.ollamaBaseUrl || "http://localhost:11434") + "/v1",
            apiKey: "ollama",
        });
    }
    async *createMessage(systemPrompt, messages) {
        const openAiMessages = [
            { role: "system", content: systemPrompt },
            ...convertToOpenAiMessages(messages),
        ];
        const stream = await this.client.chat.completions.create({
            model: this.getModel().id,
            messages: openAiMessages,
            temperature: 0,
            stream: true,
        });
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
                yield {
                    type: "text",
                    text: delta.content,
                };
            }
        }
    }
    getModel() {
        return {
            id: this.options.ollamaModelId || "",
            info: openAiModelInfoSaneDefaults,
        };
    }
}
//# sourceMappingURL=ollama.js.map
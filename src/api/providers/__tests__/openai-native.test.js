import { OpenAiNativeHandler } from "../openai-native";
import OpenAI from "openai";
import { openAiNativeDefaultModelId } from "../../../shared/api";
// Mock OpenAI
jest.mock("openai");
describe("OpenAiNativeHandler", () => {
    let handler;
    let mockOptions;
    let mockOpenAIClient;
    let mockCreate;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Setup mock options
        mockOptions = {
            openAiNativeApiKey: "test-api-key",
            apiModelId: "gpt-4o", // Use the correct model ID from shared/api.ts
        };
        // Setup mock create function
        mockCreate = jest.fn();
        // Setup mock OpenAI client
        mockOpenAIClient = {
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        };
        OpenAI.mockImplementation(() => mockOpenAIClient);
        // Create handler instance
        handler = new OpenAiNativeHandler(mockOptions);
    });
    describe("constructor", () => {
        it("should initialize with provided options", () => {
            expect(OpenAI).toHaveBeenCalledWith({
                apiKey: mockOptions.openAiNativeApiKey,
            });
        });
    });
    describe("getModel", () => {
        it("should return specified model when valid", () => {
            const result = handler.getModel();
            expect(result.id).toBe("gpt-4o"); // Use the correct model ID
        });
        it("should return default model when model ID is invalid", () => {
            handler = new OpenAiNativeHandler({
                ...mockOptions,
                apiModelId: "invalid-model",
            });
            const result = handler.getModel();
            expect(result.id).toBe(openAiNativeDefaultModelId);
        });
        it("should return default model when model ID is not provided", () => {
            handler = new OpenAiNativeHandler({
                ...mockOptions,
                apiModelId: undefined,
            });
            const result = handler.getModel();
            expect(result.id).toBe(openAiNativeDefaultModelId);
        });
    });
    describe("createMessage", () => {
        const systemPrompt = "You are a helpful assistant";
        const messages = [
            { role: "user", content: "Hello" },
        ];
        describe("o1 models", () => {
            beforeEach(() => {
                handler = new OpenAiNativeHandler({
                    ...mockOptions,
                    apiModelId: "o1-preview",
                });
            });
            it("should handle non-streaming response for o1 models", async () => {
                const mockResponse = {
                    choices: [{ message: { content: "Hello there!" } }],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 5,
                    },
                };
                mockCreate.mockResolvedValueOnce(mockResponse);
                const generator = handler.createMessage(systemPrompt, messages);
                const results = [];
                for await (const result of generator) {
                    results.push(result);
                }
                expect(results).toEqual([
                    { type: "text", text: "Hello there!" },
                    { type: "usage", inputTokens: 10, outputTokens: 5 },
                ]);
                expect(mockCreate).toHaveBeenCalledWith({
                    model: "o1-preview",
                    messages: [
                        { role: "user", content: systemPrompt },
                        { role: "user", content: "Hello" },
                    ],
                });
            });
            it("should handle missing content in response", async () => {
                const mockResponse = {
                    choices: [{ message: { content: null } }],
                    usage: null,
                };
                mockCreate.mockResolvedValueOnce(mockResponse);
                const generator = handler.createMessage(systemPrompt, messages);
                const results = [];
                for await (const result of generator) {
                    results.push(result);
                }
                expect(results).toEqual([
                    { type: "text", text: "" },
                    { type: "usage", inputTokens: 0, outputTokens: 0 },
                ]);
            });
        });
        describe("streaming models", () => {
            beforeEach(() => {
                handler = new OpenAiNativeHandler({
                    ...mockOptions,
                    apiModelId: "gpt-4o",
                });
            });
            it("should handle streaming response", async () => {
                const mockStream = [
                    { choices: [{ delta: { content: "Hello" } }], usage: null },
                    { choices: [{ delta: { content: " there" } }], usage: null },
                    { choices: [{ delta: { content: "!" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } },
                ];
                mockCreate.mockResolvedValueOnce((async function* () {
                    for (const chunk of mockStream) {
                        yield chunk;
                    }
                })());
                const generator = handler.createMessage(systemPrompt, messages);
                const results = [];
                for await (const result of generator) {
                    results.push(result);
                }
                expect(results).toEqual([
                    { type: "text", text: "Hello" },
                    { type: "text", text: " there" },
                    { type: "text", text: "!" },
                    { type: "usage", inputTokens: 10, outputTokens: 5 },
                ]);
                expect(mockCreate).toHaveBeenCalledWith({
                    model: "gpt-4o",
                    temperature: 0,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: "Hello" },
                    ],
                    stream: true,
                    stream_options: { include_usage: true },
                });
            });
            it("should handle empty delta content", async () => {
                const mockStream = [
                    { choices: [{ delta: {} }], usage: null },
                    { choices: [{ delta: { content: null } }], usage: null },
                    { choices: [{ delta: { content: "Hello" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } },
                ];
                mockCreate.mockResolvedValueOnce((async function* () {
                    for (const chunk of mockStream) {
                        yield chunk;
                    }
                })());
                const generator = handler.createMessage(systemPrompt, messages);
                const results = [];
                for await (const result of generator) {
                    results.push(result);
                }
                expect(results).toEqual([
                    { type: "text", text: "Hello" },
                    { type: "usage", inputTokens: 10, outputTokens: 5 },
                ]);
            });
        });
        it("should handle API errors", async () => {
            mockCreate.mockRejectedValueOnce(new Error("API Error"));
            const generator = handler.createMessage(systemPrompt, messages);
            await expect(async () => {
                for await (const _ of generator) {
                    // consume generator
                }
            }).rejects.toThrow("API Error");
        });
    });
});
//# sourceMappingURL=openai-native.test.js.map
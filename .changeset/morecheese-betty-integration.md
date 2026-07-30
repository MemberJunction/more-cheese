---
"@mj-more-cheese-demo/server": minor
---

Betty AI provider integration (rasa.io). Registers Betty as a first-class MJ AI Model — AIVendor (rasa.io) + AIModel (Betty, LLM) + AIModelVendor (DriverClass `BettyBotLLM`) — authored as mj-sync metadata and shipped as a MetadataSync migration so it installs on real deployments. The Server bootstrap now imports `@memberjunction/ai-betty-bot` (peer dependency) so the provider registers at MJAPI startup. The API key is supplied at runtime via `AI_VENDOR_API_KEY__BETTYBOTLLM` and is never committed.

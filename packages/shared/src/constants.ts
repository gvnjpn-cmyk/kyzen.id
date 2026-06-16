import type { EndpointDefinition } from "./types";

export const CREATOR = "Kyzen API" as const;

export const API_BASE_URL = "https://kyzenid.zyanz4758.workers.dev";

/**
 * Single source of truth for every public endpoint.
 * The docs page, the playground, and the status page all read from this list,
 * so adding a new endpoint here is enough to surface it everywhere on the site.
 */
export const ENDPOINTS: EndpointDefinition[] = [
  // ---------------------------------------------------------------------
  // AI
  // ---------------------------------------------------------------------
  {
    method: "GET",
    path: "/api/ai/chat",
    category: "ai",
    title: "Chat",
    description: "Send a message to the Kyzen AI assistant and receive a conversational reply.",
    params: [
      { name: "text", type: "string", required: true, description: "The message to send to the assistant.", example: "Hello, who are you?" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { reply: "Hey! I'm the Kyzen AI assistant. How can I help you today?" },
    },
  },
  {
    method: "GET",
    path: "/api/ai/prompt",
    category: "ai",
    title: "Prompt",
    description: "Generate a freeform text completion from a custom prompt.",
    params: [
      { name: "text", type: "string", required: true, description: "The prompt to complete.", example: "Write a tagline for a coffee shop" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { prompt: "Write a tagline for a coffee shop", completion: "Brewed for the bold." },
    },
  },
  {
    method: "GET",
    path: "/api/ai/summarize",
    category: "ai",
    title: "Summarize",
    description: "Summarize a block of text into a short, readable summary.",
    params: [
      { name: "text", type: "string", required: true, description: "The text to summarize.", example: "A long article about renewable energy..." },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { summary: "Renewable energy adoption is accelerating worldwide due to falling costs." },
    },
  },

  // ---------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------
  {
    method: "GET",
    path: "/api/tools/qrcode",
    category: "tools",
    title: "QR Code Generator",
    description: "Generate a QR code image (SVG) for any text or URL.",
    params: [
      { name: "text", type: "string", required: true, description: "The text or URL to encode.", example: "https://kyzen.dev" },
      { name: "size", type: "number", required: false, description: "Size of the QR code in pixels.", example: 256 },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { text: "https://kyzen.dev", size: 256, image: "data:image/svg+xml;base64,..." },
    },
  },
  {
    method: "GET",
    path: "/api/tools/shorturl",
    category: "tools",
    title: "URL Shortener",
    description: "Create a short link that redirects to the original URL.",
    params: [
      { name: "url", type: "string", required: true, description: "The destination URL.", example: "https://example.com/very/long/path" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { original: "https://example.com/very/long/path", short: "https://kyz.sh/aB3xQ" },
    },
  },
  {
    method: "GET",
    path: "/api/tools/password",
    category: "tools",
    title: "Password Generator",
    description: "Generate a secure random password.",
    params: [
      { name: "length", type: "number", required: false, description: "Password length (default 16).", example: 16 },
      { name: "symbols", type: "boolean", required: false, description: "Include special characters.", example: true },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { password: "k7$Wq2!pLm9@Tz4X", length: 16, symbols: true },
    },
  },
  {
    method: "GET",
    path: "/api/tools/uuid",
    category: "tools",
    title: "UUID Generator",
    description: "Generate one or more random UUID v4 values.",
    params: [
      { name: "count", type: "number", required: false, description: "Number of UUIDs to generate (default 1, max 50).", example: 1 },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { uuids: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"] },
    },
  },

  // ---------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------
  {
    method: "GET",
    path: "/api/utility/weather",
    category: "utility",
    title: "Weather",
    description: "Get the current weather conditions for a city.",
    params: [
      { name: "city", type: "string", required: true, description: "City name.", example: "Tokyo" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { city: "Tokyo", temperature: 24, condition: "Clear", humidity: 55 },
    },
  },
  {
    method: "GET",
    path: "/api/utility/ip",
    category: "utility",
    title: "IP Lookup",
    description: "Return information about the requester's IP address, or a provided IP.",
    params: [
      { name: "ip", type: "string", required: false, description: "IP address to look up (defaults to caller's IP).", example: "8.8.8.8" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { ip: "8.8.8.8", country: "US", city: "Mountain View" },
    },
  },
  {
    method: "GET",
    path: "/api/utility/currency",
    category: "utility",
    title: "Currency Conversion",
    description: "Convert an amount from one currency to another using live exchange rates.",
    params: [
      { name: "from", type: "string", required: true, description: "Source currency code.", example: "USD" },
      { name: "to", type: "string", required: true, description: "Target currency code.", example: "EUR" },
      { name: "amount", type: "number", required: true, description: "Amount to convert.", example: 100 },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { from: "USD", to: "EUR", amount: 100, converted: 92.45, rate: 0.9245 },
    },
  },

  // ---------------------------------------------------------------------
  // Fun
  // ---------------------------------------------------------------------
  {
    method: "GET",
    path: "/api/fun/animequote",
    category: "fun",
    title: "Anime Quote",
    description: "Get a random anime quote with character and anime name.",
    params: [],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { quote: "Believe in yourself, not in the you who believes in me.", character: "Kamina", anime: "Gurren Lagann" },
    },
  },
  {
    method: "GET",
    path: "/api/fun/facts",
    category: "fun",
    title: "Random Fact",
    description: "Get a random interesting fact.",
    params: [],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { fact: "Honey never spoils if stored properly." },
    },
  },
  {
    method: "GET",
    path: "/api/fun/jokes",
    category: "fun",
    title: "Random Joke",
    description: "Get a random short joke.",
    params: [],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { joke: "Why do programmers prefer dark mode? Because light attracts bugs." },
    },
  },

  // ---------------------------------------------------------------------
  // Image
  // ---------------------------------------------------------------------
  {
    method: "GET",
    path: "/api/image/quote",
    category: "image",
    title: "Quote Image",
    description: "Generate a shareable image card containing a quote.",
    params: [
      { name: "text", type: "string", required: true, description: "Quote text to render.", example: "Simple. Fast. Reliable." },
      { name: "author", type: "string", required: false, description: "Author name shown under the quote.", example: "Kyzen API" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { text: "Simple. Fast. Reliable.", author: "Kyzen API", image: "data:image/svg+xml;base64,..." },
    },
  },
  {
    method: "GET",
    path: "/api/image/profile",
    category: "image",
    title: "Profile Card",
    description: "Generate a minimal profile card image from a name and role.",
    params: [
      { name: "name", type: "string", required: true, description: "Name to display.", example: "Ada Lovelace" },
      { name: "role", type: "string", required: false, description: "Role or title to display.", example: "Software Pioneer" },
    ],
    exampleResponse: {
      success: true,
      creator: CREATOR,
      result: { name: "Ada Lovelace", role: "Software Pioneer", image: "data:image/svg+xml;base64,..." },
    },
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI",
  tools: "Tools",
  utility: "Utility",
  fun: "Fun",
  image: "Image",
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  ai: "Lightweight conversational and text-generation endpoints.",
  tools: "Everyday developer utilities like QR codes and UUIDs.",
  utility: "Real-world data: weather, IP info, and currency rates.",
  fun: "Quotes, facts, and jokes for bots and side projects.",
  image: "On-the-fly generated image cards.",
};

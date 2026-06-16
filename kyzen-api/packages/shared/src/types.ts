/**
 * Shared types for Kyzen API
 * Used by both the Hono backend (workers/api) and the Astro frontend (apps/web)
 */

export interface KyzenSuccess<T = unknown> {
  success: true;
  creator: "Kyzen API";
  result: T;
}

export interface KyzenError {
  success: false;
  creator: "Kyzen API";
  message: string;
}

export type KyzenResponse<T = unknown> = KyzenSuccess<T> | KyzenError;

export type EndpointCategory = "ai" | "tools" | "utility" | "fun" | "image";

export interface EndpointParam {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  description: string;
  example?: string | number | boolean;
}

export interface EndpointDefinition {
  method: "GET" | "POST";
  path: string;
  category: EndpointCategory;
  title: string;
  description: string;
  params: EndpointParam[];
  exampleResponse: KyzenResponse;
}

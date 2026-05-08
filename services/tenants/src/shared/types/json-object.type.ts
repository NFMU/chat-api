/**
 * Generic JSON value tree. Use when the shape is genuinely unknown
 * or when storing free-form provider payloads.
 *
 * For known shapes (tenant settings, plan features, etc.) prefer
 * a dedicated interface in this folder so the column carries
 * meaningful types.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

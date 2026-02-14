import { z } from "zod";

type JsonValue =
  | string
  | number
  | boolean
  | { [key: string]: JsonValue }
  | JsonValue[];

export async function parseRequestJson<T extends z.ZodType>(
  request: { json: () => Promise<JsonValue> },
  schema: T
): Promise<z.infer<T>> {
  const json = await request.json();
  return schema.parse(json);
}

export async function parseResponseJson<T extends z.ZodType>(
  response: { json: () => Promise<JsonValue> },
  schema: T
): Promise<z.infer<T>> {
  const json = await response.json();
  return schema.parse(json);
}


import { createHash, randomBytes } from "crypto";

export const generateOpaqueToken = (): string => {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

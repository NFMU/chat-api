export interface RequestMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

export const getRequestMetadata = (request: any): RequestMetadata => {
  const forwardedFor = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim();

  return {
    ipAddress: forwardedIp || request.ip || request.socket?.remoteAddress,
    userAgent: request.headers["user-agent"],
    deviceName: request.headers["user-agent"],
  };
};

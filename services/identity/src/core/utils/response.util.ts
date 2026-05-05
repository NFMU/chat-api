import { buildSuccessResponse } from "@xlr8-nest/core/response";

export const buildSuccessResponseProxy = <T>(data: T) => {
  return buildSuccessResponse(data, {
    includeStatusCode: true,
  });
}

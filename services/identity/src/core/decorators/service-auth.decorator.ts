import { ApiHeader } from "@nestjs/swagger";

export const ServiceAuth = () =>
  ApiHeader({
    name: "X-Service-Token",
    description: "Static inter-service token issued via deployment configuration.",
    required: true,
  });

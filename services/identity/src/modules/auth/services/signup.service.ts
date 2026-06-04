import { Injectable } from "@nestjs/common";
import { EventBus } from "@xlr8-nest/core/ddd";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import {
  addMinutes,
  generateOpaqueToken,
  hashPassword,
  hashToken,
} from "src/core/utils";
import { AuthRepository } from "../auth.repository";
import { EMAIL_VERIFICATION_EXPIRES_IN_MINUTES } from "../auth.constants";
import { EmailVerificationRequestedEvent } from "../events/email-verification-requested.event";
import { SignupInput, VerifyEmailInput } from "../inputs";
import { EmailVerificationOutput } from "../outputs";

@Injectable()
export class SignupService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly eventBus: EventBus,
  ) {}

  async signup(input: SignupInput): Promise<null> {
    if (input.password !== input.confirmPassword) {
      throw new BadRequestError(AuthError.PasswordMismatch);
    }

    const email = input.email.toLowerCase();
    const existingUser = await this.authRepository.getUserByEmail(email);
    if (existingUser) {
      throw new ConflictError(AuthError.EmailAlreadyExists);
    }

    const languageId = input.language_id ?? 1;
    const timezoneId = input.timezone_id ?? 1;
    const locationId = input.location_id ?? null;

    const [languageExists, timezoneExists, locationExists] = await Promise.all([
      this.authRepository.languageExists(languageId),
      this.authRepository.timezoneExists(timezoneId),
      locationId
        ? this.authRepository.locationExists(locationId)
        : Promise.resolve(true),
    ]);

    if (!languageExists) {
      throw new BadRequestError(AuthError.InvalidLanguage);
    }

    if (!timezoneExists) {
      throw new BadRequestError(AuthError.InvalidTimezone);
    }

    if (!locationExists) {
      throw new BadRequestError(AuthError.InvalidLocation);
    }

    const verificationToken = generateOpaqueToken();
    const now = new Date();
    const displayName = `${input.firstName} ${input.lastName}`;
    const user = await this.authRepository.createSignupUser(
      {
        email,
        passwordHash: hashPassword(input.password),
        isEmailVerified: false,
      },
      {
        displayName,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        jobTitle: input.jobTitle,
        company: input.company,
        website: input.website,
        locationId,
        bio: input.bio,
      },
      {
        languageId,
        timezoneId,
      },
      {
        tokenHash: hashToken(verificationToken),
        expiresAt: addMinutes(now, EMAIL_VERIFICATION_EXPIRES_IN_MINUTES),
      },
    );

    this.eventBus.publish(
      new EmailVerificationRequestedEvent(
        user.id,
        user.email,
        displayName,
        verificationToken,
      ),
    );

    return null;
  }

  async verifyEmail(input: VerifyEmailInput): Promise<EmailVerificationOutput> {
    const verification =
      await this.authRepository.getEmailVerificationByTokenHash(
        hashToken(input.token),
      );

    if (!verification) {
      throw new BadRequestError(AuthError.EmailVerificationInvalid);
    }

    if (!verification.user) {
      throw new NotFoundError(AuthError.UserNotFound);
    }

    if (verification.usedAt || verification.user.isEmailVerified) {
      throw new ConflictError(AuthError.EmailAlreadyVerified);
    }

    if (verification.expiresAt <= new Date()) {
      throw new BadRequestError(AuthError.EmailVerificationExpired);
    }

    await this.authRepository.markEmailVerificationUsed(
      verification,
      new Date(),
    );

    return {
      verified: true,
      user_id: verification.user.id,
      email: verification.user.email,
    };
  }
}

import { Injectable } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";
import { LoginInput, SignupInput } from "./inputs";
import { comparePassword, hashPassword } from "src/core/utils";
import { JwtService } from "@nestjs/jwt";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import { LoginOutput } from "./outputs/login.output";
import { EventBus } from "@xlr8-nest/core";
import { UserCreatedEvent } from "./events/user-created.event";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus
  ) {}

  async login(input: LoginInput): Promise<LoginOutput> {
    const { email, password } = input;
    const user = await this.authRepository.getUserByEmail(email.toLowerCase());

    const isPasswordValid = user
      ? comparePassword(password, user.passwordHash)
      : false;
    if (!isPasswordValid) {
      throw new UnauthorizedError(AuthError.InvalidCredentials);
    }

    const token = await this.jwtService.signAsync({ userId: user.id });

    return { token };
  }

  async signup(input: SignupInput): Promise<LoginOutput> {
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

    const displayName = `${input.firstName} ${input.lastName}`;
    const user = await this.authRepository.createSignupUser(
      {
        email,
        passwordHash: hashPassword(input.password),
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
    );

    this.eventBus.publish(new UserCreatedEvent(
      user.id,
      user.email,
      displayName
    ))

    return null;
  }
}

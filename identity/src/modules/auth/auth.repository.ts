import { Injectable } from "@nestjs/common";
import { TypeOrmClient } from "@xlr8-nest/core/database";
import { EmailVerification } from "src/database/entities/email-verification.entity";
import { Language } from "src/database/entities/language.entity";
import { Location } from "src/database/entities/location.entity";
import { PasswordReset } from "src/database/entities/password-reset.entity";
import { Timezone } from "src/database/entities/timezone.entity";
import { User } from "src/database/entities/user.entity";
import { UserProfile } from "src/database/entities/user-profiles.entity";
import { UserSession } from "src/database/entities/user-sessions.entity";
import { UserSettings } from "src/database/entities/user-settings.entity";

@Injectable()
export class AuthRepository {
  constructor(private readonly typeOrmClient: TypeOrmClient) {}

  get userModel() {
    return this.typeOrmClient.client.getRepository(User);
  }

  get userProfileModel() {
    return this.typeOrmClient.client.getRepository(UserProfile);
  }

  get userSettingsModel() {
    return this.typeOrmClient.client.getRepository(UserSettings);
  }

  get userSessionModel() {
    return this.typeOrmClient.client.getRepository(UserSession);
  }

  get emailVerificationModel() {
    return this.typeOrmClient.client.getRepository(EmailVerification);
  }

  get passwordResetModel() {
    return this.typeOrmClient.client.getRepository(PasswordReset);
  }

  get languageModel() {
    return this.typeOrmClient.client.getRepository(Language);
  }

  get timezoneModel() {
    return this.typeOrmClient.client.getRepository(Timezone);
  }

  get locationModel() {
    return this.typeOrmClient.client.getRepository(Location);
  }

  getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  getUserById(userId: string): Promise<User | null> {
    return this.userModel.findOne({ where: { id: userId } });
  }

  createNewUser(userData: Partial<User>): Promise<User> {
    const newUser = this.userModel.create(userData);
    return this.userModel.save(newUser);
  }

  languageExists(languageId: number): Promise<boolean> {
    return this.languageModel.existsBy({ id: languageId });
  }

  timezoneExists(timezoneId: number): Promise<boolean> {
    return this.timezoneModel.existsBy({ id: timezoneId });
  }

  locationExists(locationId: number): Promise<boolean> {
    return this.locationModel.existsBy({ id: locationId });
  }

  createSignupUser(
    userData: Partial<User>,
    profileData: Partial<UserProfile>,
    settingsData: Partial<UserSettings>,
    verificationData: Pick<EmailVerification, "tokenHash" | "expiresAt">,
  ): Promise<User> {
    return this.typeOrmClient.transaction(async () => {
      const newUser = this.userModel.create(userData);
      const user = await this.userModel.save(newUser);

      const newProfile = this.userProfileModel.create({
        ...profileData,
        userId: user.id,
      });
      await this.userProfileModel.save(newProfile);

      const newSettings = this.userSettingsModel.create({
        ...settingsData,
        userId: user.id,
      });
      await this.userSettingsModel.save(newSettings);

      const newVerification = this.emailVerificationModel.create({
        ...verificationData,
        userId: user.id,
      });
      await this.emailVerificationModel.save(newVerification);

      return user;
    });
  }

  getEmailVerificationByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerification | null> {
    return this.emailVerificationModel.findOne({
      where: { tokenHash },
      relations: { user: true },
    });
  }

  async markEmailVerificationUsed(
    verification: EmailVerification,
    usedAt: Date,
  ): Promise<void> {
    verification.usedAt = usedAt;
    verification.user.isEmailVerified = true;
    await this.typeOrmClient.transaction(async () => {
      await this.emailVerificationModel.save(verification);
      await this.userModel.save(verification.user);
    });
  }

  createUserSession(data: Partial<UserSession>): Promise<UserSession> {
    const session = this.userSessionModel.create(data);
    return this.userSessionModel.save(session);
  }

  getUserSessionById(sessionId: string): Promise<UserSession | null> {
    return this.userSessionModel.findOne({ where: { id: sessionId } });
  }

  getUserSessionByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<UserSession | null> {
    return this.userSessionModel.findOne({
      where: { refreshTokenHash },
      relations: { user: true },
    });
  }

  async rotateUserSessionRefreshToken(
    session: UserSession,
    refreshTokenHash: string,
    expiresAt: Date,
    lastUsedAt: Date,
  ): Promise<UserSession> {
    session.refreshTokenHash = refreshTokenHash;
    session.expiresAt = expiresAt;
    session.lastUsedAt = lastUsedAt;
    session.revokedAt = null;
    return this.userSessionModel.save(session);
  }

  async revokeUserSession(session: UserSession, revokedAt: Date): Promise<void> {
    session.revokedAt = revokedAt;
    await this.userSessionModel.save(session);
  }

  async revokeUserSessions(
    userId: string,
    revokedAt: Date,
    exceptSessionId?: string,
  ): Promise<void> {
    const query = this.userSessionModel
      .createQueryBuilder()
      .update(UserSession)
      .set({ revokedAt })
      .where("user_id = :userId", { userId })
      .andWhere("revoked_at IS NULL");

    if (exceptSessionId) {
      query.andWhere("id != :exceptSessionId", { exceptSessionId });
    }

    await query.execute();
  }

  listUserSessions(userId: string): Promise<UserSession[]> {
    return this.userSessionModel.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async updateUserLastLogin(userId: string, lastLoginAt: Date): Promise<void> {
    await this.userModel.update({ id: userId }, { lastLoginAt });
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.userModel.update({ id: userId }, { passwordHash });
  }

  createPasswordReset(data: Partial<PasswordReset>): Promise<PasswordReset> {
    const passwordReset = this.passwordResetModel.create(data);
    return this.passwordResetModel.save(passwordReset);
  }

  getPasswordResetByTokenHash(
    tokenHash: string,
  ): Promise<PasswordReset | null> {
    return this.passwordResetModel.findOne({
      where: { tokenHash },
      relations: { user: true },
    });
  }

  async markPasswordResetUsed(
    passwordReset: PasswordReset,
    usedAt: Date,
  ): Promise<void> {
    passwordReset.usedAt = usedAt;
    await this.passwordResetModel.save(passwordReset);
  }
}

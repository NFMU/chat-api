import { Injectable } from "@nestjs/common";
import { TypeOrmClient } from "@xlr8-nest/core/database";
import { Language } from "src/database/entities/language.entity";
import { Location } from "src/database/entities/location.entity";
import { Timezone } from "src/database/entities/timezone.entity";
import { User } from "src/database/entities/user.entity";
import { UserProfile } from "src/database/entities/user-profiles.entity";
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

      return user;
    });
  }
}

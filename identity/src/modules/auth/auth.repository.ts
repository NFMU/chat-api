import { Injectable } from "@nestjs/common";
import { TypeOrmClient } from "@xlr8-nest/core/database";
import { User } from "src/database/entities/user.entity";

@Injectable()
export class AuthRepository {
  constructor(
    private readonly typeOrmClient: TypeOrmClient
  ) {}

  get userModel(){
    return this.typeOrmClient.client.getRepository(User);
  }

  getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  createNewUser(userData: Partial<User>): Promise<User> {
    const newUser = this.userModel.create(userData);
    return this.userModel.save(newUser);
  }
}
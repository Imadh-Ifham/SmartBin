import { UserModel, IUser } from "../models/user.model";

export class UserRepository {
  async findByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username }).exec();
  }

  async create(user: Partial<IUser>): Promise<IUser> {
    const newUser = new UserModel(user);
    return newUser.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).exec();
  }
}

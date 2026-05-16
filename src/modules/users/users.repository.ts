import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument, UserStatus } from './schemas/users.schema';
import { CreateUserModel } from './model/createUser.model';

@Injectable()
export class UsersRepository implements OnModuleInit {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private normalizeEmail(email: string): string {
    return String(email).trim().toLowerCase();
  }

  private normalizeUsername(username: string): string {
    return String(username).trim().toLowerCase();
  }

  async onModuleInit(): Promise<void> {
    await this.reconcileIndexes();
  }

  private async reconcileIndexes(): Promise<void> {
    const legacyIndexName = 'userId_1';

    try {
      const indexes = await this.userModel.collection.indexes();
      const hasLegacyIndex = indexes.some(
        (index) => index.name === legacyIndexName,
      );

      if (hasLegacyIndex) {
        await this.userModel.collection.dropIndex(legacyIndexName);
        this.logger.log(
          `Indice obsoleto "${legacyIndexName}" eliminado de la coleccion users.`,
        );
      }

      await this.userModel.syncIndexes();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `No se pudieron reconciliar los indices de users: ${message}`,
      );
    }
  }

  // Create a new user
  async createUser(input: CreateUserModel): Promise<UserDocument> {
    const createdUser = await this.userModel.create(input);
    return createdUser;
  }

  // Find user by id
  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  // Find user by email
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: this.normalizeEmail(email) }).exec();
  }

  // Find user by username
  async findByUsername(username: string): Promise<UserDocument | null> {
    const normalizedUsername = this.normalizeUsername(username);
    return this.userModel
      .findOne({
        $or: [
          { usernameNormalized: normalizedUsername },
          {
            username: {
              $regex: `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              $options: 'i',
            },
          },
        ],
      })
      .exec();
  }

  // Find users with filters and pagination
  async findWithFilters(
    query: FilterQuery<User>,
    skip: number,
    limit: number,
  ): Promise<{ items: UserDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  // Find all deleted users with pagination
  async findAllDeleted(
    skip: number,
    limit: number,
  ): Promise<{ items: UserDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.userModel
        .find({ status: UserStatus.ELIMINADO })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments({ status: UserStatus.ELIMINADO }).exec(),
    ]);
    return { items, total };
  }

  // Update any field(s) of a user
  async updateField(
    userId: string,
    update: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, update, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  async incrementFailedLoginAttempts(
    userId: string,
    shouldSuspend: boolean,
    failedAt: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $inc: { failedLoginAttempts: 1 },
          $set: {
            lastFailedLoginAt: failedAt,
            ...(shouldSuspend
              ? {
                  status: UserStatus.SUSPENDIDO,
                  refreshTokenHash: null,
                }
              : {}),
          },
        },
        { new: true },
      )
      .exec();
  }

  async resetFailedLoginAttempts(
    userId: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
        },
        { new: true },
      )
      .exec();
  }

  // Soft delete a user
  async softDeleteUser(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { status: UserStatus.ELIMINADO },
        { new: true },
      )
      .exec();
  }

  // Hard delete a user
  async deleteUser(userId: string): Promise<UserDocument | null> {
    const deletedUser = await this.userModel.findByIdAndDelete(userId);
    if (!deletedUser) return null;
    return deletedUser;
  }

  // Restore user status from ELIMINADO -> ACTIVO atomically
  async restoreStatus(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id: userId, status: UserStatus.ELIMINADO },
        { status: UserStatus.ACTIVO },
        { new: true },
      )
      .exec();
  }
}

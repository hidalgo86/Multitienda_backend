import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BusinessSettings,
  BusinessSettingsDocument,
} from './schemas/business-settings.schema';
import { BusinessSettingsModel } from './models/business-settings.model';

const SETTINGS_KEY = 'main';

@Injectable()
export class BusinessSettingsRepository {
  constructor(
    @InjectModel(BusinessSettings.name)
    private readonly settingsModel: Model<BusinessSettingsDocument>,
  ) {}

  async findMain(): Promise<BusinessSettingsModel | null> {
    const settings = await this.settingsModel
      .findOne({ key: SETTINGS_KEY })
      .exec();
    return settings?.toObject() ?? null;
  }

  async upsertMain(
    input: Partial<BusinessSettings>,
  ): Promise<BusinessSettingsModel> {
    const settings = await this.settingsModel
      .findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { ...input, key: SETTINGS_KEY } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return settings.toObject();
  }
}

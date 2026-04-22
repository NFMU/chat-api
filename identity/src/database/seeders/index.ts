export * from './language.seeder';
export * from './timezone.seeder';

import { LanguageSeeder } from './language.seeder';
import { TimezoneSeeder } from './timezone.seeder';

export const databaseSeeders = [LanguageSeeder, TimezoneSeeder];

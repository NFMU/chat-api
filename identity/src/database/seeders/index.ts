export * from "./language.seeder";
export * from "./location.seeder";
export * from "./timezone.seeder";

import { LanguageSeeder } from "./language.seeder";
import { LocationSeeder } from "./location.seeder";
import { TimezoneSeeder } from "./timezone.seeder";

export const databaseSeeders = [LanguageSeeder, TimezoneSeeder, LocationSeeder];

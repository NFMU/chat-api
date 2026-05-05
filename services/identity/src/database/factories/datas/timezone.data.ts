function getUtcOffset(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const offset =
    formatter
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";

  return offset === "GMT" ? "+00:00" : offset.replace("GMT", "");
}

const DEFAULT_TIMEZONE_NAME = "UTC";

const timeZoneNames = Array.from(
  new Set([DEFAULT_TIMEZONE_NAME, ...Intl.supportedValuesOf("timeZone")]),
);

// The schema stores a single scalar offset, so we persist the offset observed
// when the seeder runs instead of attempting to model DST rules in this table.
export const timezoneData = timeZoneNames.map((name) => ({
  name,
  utc_offset: getUtcOffset(name),
}));

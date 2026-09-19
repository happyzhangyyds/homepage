const LOCATION = {
  latitude: 23.17,
  longitude: 113.51,
  timeZoneOffset: 8,
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;

const dayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86_400_000);
};

const minutesSinceMidnight = (date) => date.getHours() * 60 + date.getMinutes();

// NOAA's solar-position approximation. It is accurate enough for choosing a
// background phase and does not add a network request or a runtime dependency.
export const getSunTimes = (date = new Date()) => {
  const day = dayOfYear(date);
  const gamma = (2 * Math.PI * (day - 1)) / 365;
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const latitude = toRadians(LOCATION.latitude);
  const zenith = toRadians(90.833);
  const hourAngle = Math.acos(
    Math.min(
      1,
      Math.max(-1, Math.cos(zenith) / (Math.cos(latitude) * Math.cos(declination)) - Math.tan(latitude) * Math.tan(declination))
    )
  );
  const solarNoon = 720 - 4 * LOCATION.longitude - equationOfTime + LOCATION.timeZoneOffset * 60;
  const offset = 4 * toDegrees(hourAngle);

  return { sunrise: solarNoon - offset, sunset: solarNoon + offset };
};

export const getSixLightsPhase = (date = new Date()) => {
  const { sunrise, sunset } = getSunTimes(date);
  const now = minutesSinceMidnight(date);
  const dawnEnd = sunrise + 45;
  const sunsetStart = sunset - 45;
  const solarNoon = (sunrise + sunset) / 2;
  const deepNightStart = Math.min(23.5 * 60, sunset + 210);

  if (now < sunrise - 45 || now >= deepNightStart) return 6;
  if (now < dawnEnd) return 1;
  if (now < solarNoon) return 2;
  if (now < sunsetStart) return 3;
  if (now < sunset + 45) return 4;
  return 5;
};

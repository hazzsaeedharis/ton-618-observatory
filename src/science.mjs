// SI constants. The scale comparison deliberately assumes a nonrotating hole.
export const G = 6.6743e-11;
export const C = 299792458;
export const SOLAR_MASS_KG = 1.98847e30;
export const AU_METERS = 149597870700;
export const REFERENCE_MASS = 66e9;
export const NEPTUNE_ORBIT_AU = 30.07;
export function schwarzschildRadiusAU(solarMasses) {
  if (!Number.isFinite(solarMasses) || solarMasses <= 0)
    throw new RangeError("Mass must be positive and finite");
  return (2 * G * solarMasses * SOLAR_MASS_KG) / (C * C * AU_METERS);
}
export function scaleMetrics(solarMasses = REFERENCE_MASS) {
  const radiusAU = schwarzschildRadiusAU(solarMasses);
  return {
    radiusAU,
    diameterAU: radiusAU * 2,
    neptuneRatio: radiusAU / NEPTUNE_ORBIT_AU,
    lightCrossingDays: (radiusAU * 2 * AU_METERS) / C / 86400,
  };
}

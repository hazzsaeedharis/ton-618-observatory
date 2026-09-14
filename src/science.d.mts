export const G: number;
export const C: number;
export const SOLAR_MASS_KG: number;
export const AU_METERS: number;
export const REFERENCE_MASS: number;
export const NEPTUNE_ORBIT_AU: number;
export function schwarzschildRadiusAU(solarMasses: number): number;
export function scaleMetrics(solarMasses?: number): {
  radiusAU: number;
  diameterAU: number;
  neptuneRatio: number;
  lightCrossingDays: number;
};

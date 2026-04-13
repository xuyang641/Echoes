import { describe, it, expect } from 'vitest';
import { wgs84ToGcj02, gcj02ToWgs84 } from './coord-transform';

describe('Coordinate Transformation Utilities (wgs84 & gcj02)', () => {
  // Typical coordinate in Beijing (Tiananmen Square)
  const BEIJING_WGS84 = { lat: 39.9042, lng: 116.4074 };
  // Approximate GCJ-02 coordinates for Tiananmen Square
  const BEIJING_GCJ02 = { lat: 39.90510, lng: 116.41362 };

  // Typical coordinate outside China (e.g., New York Central Park)
  const NY_WGS84 = { lat: 40.7812, lng: -73.9665 };

  it('should transform WGS-84 to GCJ-02 correctly within China', () => {
    const [gcjLat, gcjLng] = wgs84ToGcj02(BEIJING_WGS84.lat, BEIJING_WGS84.lng);
    
    // The transformation should shift the coordinates slightly (the "Mars" offset)
    expect(gcjLat).toBeGreaterThan(BEIJING_WGS84.lat);
    expect(gcjLng).toBeGreaterThan(BEIJING_WGS84.lng);
    
    // We check if it's close to the expected GCJ02 value (within a small margin of error)
    expect(gcjLat).toBeCloseTo(BEIJING_GCJ02.lat, 3);
    expect(gcjLng).toBeCloseTo(BEIJING_GCJ02.lng, 3);
  });

  it('should not apply transformation for coordinates outside China', () => {
    const [gcjLat, gcjLng] = wgs84ToGcj02(NY_WGS84.lat, NY_WGS84.lng);
    
    // Coordinates outside China should remain exactly the same
    expect(gcjLat).toBe(NY_WGS84.lat);
    expect(gcjLng).toBe(NY_WGS84.lng);
  });

  it('should transform GCJ-02 back to WGS-84 correctly', () => {
    const [wgsLat, wgsLng] = gcj02ToWgs84(BEIJING_GCJ02.lat, BEIJING_GCJ02.lng);
    
    // Check if it reverses back to the original WGS84 coordinate
    // The GCJ->WGS84 formula in use is an approximation, so precision is set to 3 decimal places
    expect(wgsLat).toBeCloseTo(BEIJING_WGS84.lat, 3);
    expect(wgsLng).toBeCloseTo(BEIJING_WGS84.lng, 3);
  });

  it('should be roughly reversible (WGS84 -> GCJ02 -> WGS84)', () => {
    const originalLat = 31.2304; // Shanghai
    const originalLng = 121.4737;

    // Convert to GCJ02
    const [gcjLat, gcjLng] = wgs84ToGcj02(originalLat, originalLng);
    
    // Convert back to WGS84
    const [finalLat, finalLng] = gcj02ToWgs84(gcjLat, gcjLng);

    // The result should be very close to the original (lossless transformation)
    expect(finalLat).toBeCloseTo(originalLat, 4);
    expect(finalLng).toBeCloseTo(originalLng, 4);
  });

  it('should handle edge cases (equator, prime meridian) correctly', () => {
    // Equator, but outside China longitude bounds
    const [lat1, lng1] = wgs84ToGcj02(0, 100);
    expect(lat1).toBe(0);
    expect(lng1).toBe(100);
    
    // Inside China bounding box but invalid lat/lng mathematically should still compute without crashing
    const [lat2, lng2] = wgs84ToGcj02(35.0, 105.0);
    expect(typeof lat2).toBe('number');
    expect(typeof lng2).toBe('number');
    expect(Number.isNaN(lat2)).toBe(false);
  });
});

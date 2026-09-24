import { describe, it, expect } from 'vitest';
import { formatRecordToGeoJsonFeature, formatRecordsToFeatureCollection } from '../src/utils/geojson';
import { formatRecordsToCsv } from '../src/utils/csv';
import { PestRecord } from '@prisma/client';

describe('GeoJSON and CSV Utilities for QGIS Integration', () => {
  const mockRecord: PestRecord = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    pestName: 'Spodoptera frugiperda',
    quantity: 15,
    crop: 'Milho Safrinha',
    plot: 'Talhão 04',
    growthStage: 'V4',
    notes: 'Presença em folhas do cartucho',
    latitude: -15.7801,
    longitude: -47.9292,
    altitude: 1040.5,
    accuracy: 3.2,
    imagePath: null,
    userId: 'user-uuid-1',
    createdAt: new Date('2026-09-22T10:00:00.000Z'),
    updatedAt: new Date('2026-09-22T10:00:00.000Z'),
  };

  it('should format record as valid GeoJSON RFC 7946 Feature', () => {
    const feature = formatRecordToGeoJsonFeature(mockRecord);

    expect(feature.type).toBe('Feature');
    expect(feature.id).toBe(mockRecord.id);
    expect(feature.geometry.type).toBe('Point');
    // Em GeoJSON o padrão RFC 7946 define [longitude, latitude, altitude]
    expect(feature.geometry.coordinates[0]).toBe(-47.9292);
    expect(feature.geometry.coordinates[1]).toBe(-15.7801);
    expect(feature.geometry.coordinates[2]).toBe(1040.5);

    expect(feature.properties.praga).toBe('Spodoptera frugiperda');
    expect(feature.properties.quantidade).toBe(15);
    expect(feature.properties.cultura).toBe('Milho Safrinha');
    expect(feature.properties.talhao).toBe('Talhão 04');
  });

  it('should format records as GeoJSON FeatureCollection', () => {
    const collection = formatRecordsToFeatureCollection([mockRecord]);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(1);
    expect(collection.crs?.properties.name).toBe('urn:ogc:def:crs:OGC:1.3:CRS84');
  });

  it('should format records as CSV with WKT geometry', () => {
    const csv = formatRecordsToCsv([mockRecord]);

    expect(csv).toContain('id,praga,quantidade,cultura,talhao');
    expect(csv).toContain('wkt_geom');
    expect(csv).toContain('POINT(-47.9292 -15.7801)');
    expect(csv).toContain('Spodoptera frugiperda');
    expect(csv).toContain('15');
  });
});

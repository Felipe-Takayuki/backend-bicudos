import { PestRecord } from '@prisma/client';

export interface GeoJsonPointGeometry {
  type: 'Point';
  coordinates: [number, number, number?];
}

export interface GeoJsonFeature {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    praga: string;
    quantidade: number;
    cultura: string;
    talhao: string;
    estagio: string;
    observacoes: string;
    data_hora: string;
    latitude: number;
    longitude: number;
    altitude_m: number | null;
    precisao_gps_m: number | null;
    usuario_id?: string | null;
  };
  geometry: GeoJsonPointGeometry;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  name?: string;
  crs?: {
    type: 'name';
    properties: {
      name: 'urn:ogc:def:crs:OGC:1.3:CRS84';
    };
  };
  features: GeoJsonFeature[];
}

export const formatRecordToGeoJsonFeature = (record: PestRecord): GeoJsonFeature => {
  const coordinates: [number, number, number?] = [
    record.longitude,
    record.latitude,
    record.altitude ?? undefined,
  ];

  return {
    type: 'Feature',
    id: record.id,
    properties: {
      id: record.id,
      praga: record.pestName,
      quantidade: record.quantity,
      cultura: record.crop ?? '',
      talhao: record.plot ?? '',
      estagio: record.growthStage ?? '',
      observacoes: record.notes ?? '',
      data_hora: record.createdAt.toISOString(),
      latitude: record.latitude,
      longitude: record.longitude,
      altitude_m: record.altitude,
      precisao_gps_m: record.accuracy,
      usuario_id: record.userId,
    },
    geometry: {
      type: 'Point',
      coordinates,
    },
  };
};

export const formatRecordsToFeatureCollection = (
  records: PestRecord[],
  layerName = 'monitoramento_pragas'
): GeoJsonFeatureCollection => {
  return {
    type: 'FeatureCollection',
    name: layerName,
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
      },
    },
    features: records.map(formatRecordToGeoJsonFeature),
  };
};

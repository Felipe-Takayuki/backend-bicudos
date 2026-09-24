import { PestRecord } from '@prisma/client';

export const formatRecordsToCsv = (records: PestRecord[]): string => {
  const headers = [
    'id',
    'praga',
    'quantidade',
    'cultura',
    'talhao',
    'estagio',
    'observacoes',
    'data_iso',
    'latitude',
    'longitude',
    'altitude_m',
    'precisao_m',
    'wkt_geom',
  ];

  const escapeField = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((record) => {
    const wkt = `POINT(${record.longitude} ${record.latitude})`;
    return [
      escapeField(record.id),
      escapeField(record.pestName),
      escapeField(record.quantity),
      escapeField(record.crop),
      escapeField(record.plot),
      escapeField(record.growthStage),
      escapeField(record.notes),
      escapeField(record.createdAt.toISOString()),
      escapeField(record.latitude),
      escapeField(record.longitude),
      escapeField(record.altitude ?? ''),
      escapeField(record.accuracy ? record.accuracy.toFixed(1) : ''),
      escapeField(wkt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

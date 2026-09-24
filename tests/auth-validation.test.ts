import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  passwordValidation,
} from '../src/modules/auth/schemas/auth.schema';
import {
  createPestRecordSchema,
  nearbyQuerySchema,
} from '../src/modules/pest-records/schemas/pest-record.schema';

describe('Zod Validation Schemas & Security Rules', () => {
  describe('Password Security Complexity', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordValidation.safeParse('Ab1!');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      const result = passwordValidation.safeParse('senhaforte123');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      const result = passwordValidation.safeParse('SENHAFORTE123');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      const result = passwordValidation.safeParse('SenhaForteSemNumero');
      expect(result.success).toBe(false);
    });

    it('should accept strong password meeting all criteria', () => {
      const result = passwordValidation.safeParse('SenhaForte123');
      expect(result.success).toBe(true);
    });
  });

  describe('User Registration Validation', () => {
    it('should accept valid registration payload', () => {
      const valid = {
        name: 'Dra. Renata',
        email: 'renata@fazenda.com.br',
        password: 'SenhaSegura123',
        role: 'AGRONOMIST',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('renata@fazenda.com.br');
      }
    });

    it('should reject invalid email', () => {
      const invalid = {
        name: 'Dra. Renata',
        email: 'email-invalido-sem-arroba',
        password: 'SenhaSegura123',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Pest Record Geolocation Validation', () => {
    it('should accept valid coordinates and pest data', () => {
      const validRecord = {
        pestName: 'Helicoverpa armigera',
        quantity: 5,
        latitude: -15.7801,
        longitude: -47.9292,
        crop: 'Soja',
      };
      const result = createPestRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    });

    it('should reject latitude outside [-90, 90]', () => {
      const invalidLat = {
        pestName: 'Helicoverpa armigera',
        quantity: 5,
        latitude: 95.5,
        longitude: -47.9292,
      };
      const result = createPestRecordSchema.safeParse(invalidLat);
      expect(result.success).toBe(false);
    });

    it('should reject longitude outside [-180, 180]', () => {
      const invalidLng = {
        pestName: 'Helicoverpa armigera',
        quantity: 5,
        latitude: -15.7801,
        longitude: -195.0,
      };
      const result = createPestRecordSchema.safeParse(invalidLng);
      expect(result.success).toBe(false);
    });

    it('should reject quantity less than 1', () => {
      const invalidQty = {
        pestName: 'Helicoverpa armigera',
        quantity: 0,
        latitude: -15.7801,
        longitude: -47.9292,
      };
      const result = createPestRecordSchema.safeParse(invalidQty);
      expect(result.success).toBe(false);
    });

    it('should validate nearby spatial query', () => {
      const validNearby = {
        latitude: '-15.7801',
        longitude: '-47.9292',
        radius: '10000',
      };
      const result = nearbyQuerySchema.safeParse(validNearby);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius).toBe(10000);
      }
    });
  });
});

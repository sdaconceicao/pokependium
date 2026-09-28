import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { GroupRequestPipe } from './group-request.pipe';

describe('GroupRequestPipe', () => {
  describe('when name is required (create)', () => {
    const pipe = new GroupRequestPipe(true);

    it('trims and returns a valid name', () => {
      const result = pipe.transform({ name: '  My Team  ' });

      expect(result).toEqual({ name: 'My Team' });
    });

    it('throws when name is absent', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('throws when name is invalid', () => {
      expect(() => pipe.transform({ name: '' })).toThrow(BadRequestException);
    });
  });

  describe('when name is optional (update)', () => {
    const pipe = new GroupRequestPipe(false);

    it('passes through when name is absent', () => {
      const result = pipe.transform({ isDefault: true });

      expect(result).toEqual({ isDefault: true });
    });

    it('validates and trims name when present', () => {
      const result = pipe.transform({ name: ' Renamed ' });

      expect(result).toEqual({ name: 'Renamed' });
    });

    it('throws when the provided name is invalid', () => {
      expect(() => pipe.transform({ name: 'a'.repeat(51) })).toThrow(
        BadRequestException,
      );
    });
  });
});

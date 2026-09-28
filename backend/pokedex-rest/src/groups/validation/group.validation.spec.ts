import { describe, expect, it } from 'vitest';
import { validateGroupName, validatePokemonRef } from './group.validation';

describe('validateGroupName', () => {
  it('accepts a normal name', () => {
    const result = validateGroupName('My Team');

    expect(result).toEqual({ isValid: true, errors: [] });
  });

  it('accepts a name at the 50 character boundary', () => {
    const result = validateGroupName('a'.repeat(50));

    expect(result.isValid).toBe(true);
  });

  it('rejects a name over 50 characters', () => {
    const result = validateGroupName('a'.repeat(51));

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['Name must be between 1 and 50 characters']);
  });

  it('rejects an empty string', () => {
    const result = validateGroupName('');

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['Name must be between 1 and 50 characters']);
  });

  it('rejects a whitespace-only string', () => {
    const result = validateGroupName('   ');

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['Name must be between 1 and 50 characters']);
  });

  it.each([undefined, null, 42, {}, []])(
    'rejects non-string input %p',
    (value) => {
      const result = validateGroupName(value);

      expect(result).toEqual({ isValid: false, errors: ['Name is required'] });
    },
  );
});

describe('validatePokemonRef', () => {
  it('accepts an alphanumeric value', () => {
    const result = validatePokemonRef('pikachu-25', 'pokemonId');

    expect(result).toEqual({ isValid: true, errors: [] });
  });

  it('accepts a value at the 64 character boundary', () => {
    const result = validatePokemonRef('a'.repeat(64), 'pokemonId');

    expect(result.isValid).toBe(true);
  });

  it('rejects a value over 64 characters', () => {
    const result = validatePokemonRef('a'.repeat(65), 'speciesId');

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'speciesId must be alphanumeric and at most 64 characters',
    ]);
  });

  it('rejects an empty string', () => {
    const result = validatePokemonRef('', 'pokemonId');

    expect(result).toEqual({
      isValid: false,
      errors: ['pokemonId is required'],
    });
  });

  it('rejects a value with disallowed characters', () => {
    const result = validatePokemonRef('pika chu!', 'pokemonId');

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'pokemonId must be alphanumeric and at most 64 characters',
    ]);
  });

  it.each([undefined, null, 42, {}])('rejects non-string input %p', (value) => {
    const result = validatePokemonRef(value, 'speciesId');

    expect(result).toEqual({
      isValid: false,
      errors: ['speciesId is required'],
    });
  });
});

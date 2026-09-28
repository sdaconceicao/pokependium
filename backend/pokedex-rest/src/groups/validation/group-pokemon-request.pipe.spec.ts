import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { GroupPokemonRequestPipe } from './group-pokemon-request.pipe';

describe('GroupPokemonRequestPipe', () => {
  const pipe = new GroupPokemonRequestPipe();

  it('returns the value unchanged when valid', () => {
    const value = { pokemonId: '25', speciesId: '25' };

    expect(pipe.transform(value)).toBe(value);
  });

  it('throws when pokemonId is missing', () => {
    expect(() => pipe.transform({ speciesId: '25' } as never)).toThrow(
      BadRequestException,
    );
  });

  it('throws when speciesId is invalid', () => {
    expect(() =>
      pipe.transform({ pokemonId: '25', speciesId: 'bad id!' }),
    ).toThrow(BadRequestException);
  });

  it('collects errors for both fields', () => {
    try {
      pipe.transform({ pokemonId: '', speciesId: '' });
      throw new Error('expected transform to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        errors: string[];
      };
      expect(response.errors).toEqual([
        'pokemonId is required',
        'speciesId is required',
      ]);
    }
  });
});

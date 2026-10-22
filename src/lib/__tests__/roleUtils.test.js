import { describe, expect, test } from '@jest/globals';
import { canViewPlatformManagement } from '../roleUtils';

describe('canViewPlatformManagement', () => {
  test.each(['ewinma@gmail.com', '3marin7@gmail.com'])(
    'allows %s to view platform management',
    (email) => {
      expect(canViewPlatformManagement(email)).toBe(true);
    }
  );

  test('compares email addresses without case or surrounding whitespace', () => {
    expect(canViewPlatformManagement(' EWINMA@GMAIL.COM ')).toBe(true);
  });

  test.each(['other@gmail.com', '', null, undefined])(
    'does not allow %s to view platform management',
    (email) => {
      expect(canViewPlatformManagement(email)).toBe(false);
    }
  );
});

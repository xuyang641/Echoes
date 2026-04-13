import { describe, it, expect } from 'vitest';
import { getMoodColor, MOODS } from './mood-constants';

describe('Mood Constants & Utilities', () => {
  it('should return correct color for built-in moods', () => {
    expect(getMoodColor('Happy')).toBe('#fcd34d');
    expect(getMoodColor('Sad')).toBe('#60a5fa');
    expect(getMoodColor('Angry')).toBe('#f87171');
  });

  it('should return default gray for unknown moods', () => {
    expect(getMoodColor('UnknownMood')).toBe('#e5e7eb');
    expect(getMoodColor('')).toBe('#e5e7eb');
    // @ts-ignore
    expect(getMoodColor(undefined)).toBe('#e5e7eb');
  });

  it('should handle custom moods correctly', () => {
    const customMoods = [
      { name: 'Sleepy', icon: null, color: 'bg-purple-100 text-purple-700', hex: '#c084fc', isCustom: true }
    ];
    
    expect(getMoodColor('Sleepy', customMoods)).toBe('#c084fc');
    
    // Built-in moods should still work when custom moods are provided
    expect(getMoodColor('Happy', customMoods)).toBe('#fcd34d');
  });

  it('should have valid built-in MOODS array', () => {
    expect(Array.isArray(MOODS)).toBe(true);
    expect(MOODS.length).toBeGreaterThan(0);
    
    MOODS.forEach(mood => {
      expect(mood).toHaveProperty('name');
      expect(mood).toHaveProperty('icon');
      expect(mood).toHaveProperty('color');
      expect(mood).toHaveProperty('hex');
      expect(typeof mood.name).toBe('string');
      expect(typeof mood.hex).toBe('string');
      expect(mood.hex.startsWith('#')).toBe(true);
    });
  });
});
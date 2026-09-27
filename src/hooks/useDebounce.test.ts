import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce (PERF-3)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ne propage la valeur qu’après le délai d’inactivité', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: '' },
    });

    rerender({ value: 'A' });
    rerender({ value: 'Aw' });
    rerender({ value: 'Awa' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('Awa');
  });
});

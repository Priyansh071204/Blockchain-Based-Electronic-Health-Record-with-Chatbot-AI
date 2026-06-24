import '@testing-library/jest-dom';
import { vi } from 'vitest';


const canvasContextMock = {
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fillText: vi.fn(),
  closePath: vi.fn(),
  strokeRect: vi.fn(),
  fillRect: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
  set strokeStyle(_value: string | CanvasGradient | CanvasPattern) {},
  set lineWidth(_value: number) {},
  set font(_value: string) {},
  set globalAlpha(_value: number) {},
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => canvasContextMock),
});

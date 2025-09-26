import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock the global saveAs function provided by FileSaver.js
// In a real browser, this is on the window object. In Jest's JSDOM environment, we need to define it.
(globalThis as any).saveAs = jest.fn();

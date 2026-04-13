'use strict';

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_123';
process.env.JWT_REFRESH_SECRET = 'test_refresh_key_123';
process.env.MOCK_FABRIC = 'true';

// Lock the environment variables for testing to prevent overwrites by dotenv
Object.defineProperty(process.env, 'JWT_SECRET', { value: 'test_secret_key_123', writable: false });
Object.defineProperty(process.env, 'JWT_REFRESH_SECRET', { value: 'test_refresh_key_123', writable: false });
Object.defineProperty(process.env, 'MOCK_FABRIC', { value: 'true', writable: false });

jest.setTimeout(15000);

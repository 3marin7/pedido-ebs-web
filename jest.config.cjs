// jest.config.cjs
module.exports = {
  testEnvironment: 'jsdom',
  
  // Rutas de tests
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx}',
    '**/*.{spec,test}.{js,jsx}'
  ],
  
  // Transformaciones
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  
  // Módulos y mocks
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.js',
    '^./supabase$': '<rootDir>/__mocks__/lib/supabase.js',
  },
  
  // Setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Cobertura
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  
  // Ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // Verbose
  verbose: true,
}

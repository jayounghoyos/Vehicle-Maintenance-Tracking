/**
 * One command, two kinds of test.
 *
 * Unit tests mock what they talk to and run anywhere; integration tests
 * need postgres. They are separate projects rather than separate scripts
 * so `jest --coverage` reports one number for the suite as a whole,
 * instead of two that nobody can add up.
 */
const transform = { '^.+\\.(t|j)s$': 'ts-jest' };

module.exports = {
  rootDir: '.',
  // the integration suites share one database and each starts by wiping
  // it, so two of them at once would tear the schema out from under each
  // other. The whole run takes seconds; parallelism buys nothing here.
  maxWorkers: 1,
  projects: [
    {
      displayName: 'unit',
      rootDir: '.',
      testRegex: 'src/.*\\.spec\\.ts$',
      transform,
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      rootDir: '.',
      testRegex: 'test/.*\\.e2e-spec\\.ts$',
      transform,
      testEnvironment: 'node',
      testTimeout: 30000,
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    // wiring and declarations, not behaviour
    '!src/**/*.module.ts',
    '!src/**/dto.ts',
    '!src/**/*.types.ts',
    '!src/entities/**',
    '!src/migrations/**',
    '!src/seed/**',
    '!src/main.ts',
    '!src/data-source.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
};

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    // Existing auth effects clear private state immediately on session changes.
    // Keep the migration findings visible while the shared-session refactor is pending.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  globalIgnores(['.next/**', '.next-pages/**', 'backend/**', 'playwright-report/**', 'test-results/**', 'baseline-results/**', 'baseline-learn/**']),
]);

import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

// The same Debian Chromium and font set is used locally and in CI (see docs).
process.env.FONTCONFIG_FILE = resolve('tests/visual/fontconfig.conf');
export default defineConfig({
 testDir: './tests/visual', fullyParallel: true, workers: 2,
 forbidOnly: !!process.env.CI, retries: 0, timeout: 45000,
 outputDir: 'test-results', reporter: [['list'], ['html', { open: 'never' }]],
 snapshotPathTemplate: '{testDir}/baselines/{projectName}/{arg}{ext}',
 expect: { timeout: 5000, toHaveScreenshot: { animations: 'disabled', caret: 'hide', threshold: .2, maxDiffPixelRatio: .001 } },
 use: { baseURL: 'http://127.0.0.1:3107', browserName: 'chromium',
  launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
  locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', reducedMotion: 'reduce',
  deviceScaleFactor: 1, serviceWorkers: 'block', trace: 'retain-on-failure' },
 projects: [320,375,390,430,768,1024,1280,1440].map(width => ({ name: `${width}`, use: { viewport: { width, height: 900 } } })),
 webServer: { command: 'node scripts/visual-preview.mjs', url: 'http://127.0.0.1:3107/index.html', reuseExistingServer: false },
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      name: "pokedex-graphql",
      command: "cd backend/pokedex-graphql && pn  start:dev:mock",
      url: "http://localhost:4000/graphql",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      name: "pokedex-auth-and-rest",
      command: "bash scripts/start-e2e-backends.sh",
      url: "http://localhost:3005/health",
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
      env: {
        DB_HOST: "localhost",
        DB_PORT: "5434",
        DB_USERNAME: "pokedex_user",
        DB_PASSWORD: "pokedex_password",
        DB_DATABASE: "pokedex_test",
        JWT_SECRET: "test-secret-key-for-e2e-tests",
      },
    },
    {
      name: "frontend",
      command: "cd frontend && pn  start:dev:test",
      url: "http://localhost:3010",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_AUTH_API_URL: "http://localhost:3006",
        NEXT_PUBLIC_REST_API_URL: "http://localhost:3005",
      },
    },
  ],
});

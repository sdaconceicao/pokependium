import { expect, type Locator, type Page } from "@playwright/test";
import { Client } from "pg";

export function getAuthDialog(page: Page): Locator {
  return page.getByRole("dialog");
}

export async function openSignInModal(page: Page) {
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(getAuthDialog(page)).toBeVisible();
}

export async function openRegisterForm(page: Page) {
  await openSignInModal(page);
  await getAuthDialog(page).getByRole("button", { name: "Sign up" }).click();
  await expect(
    getAuthDialog(page).getByRole("heading", { name: "Create Account" })
  ).toBeVisible();
}

export function getToast(page: Page): Locator {
  return page.locator(".react-aria-ToastRegion");
}

export async function expectLoggedIn(page: Page) {
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
}

export async function dismissToasts(page: Page) {
  const close = getToast(page).getByRole("button", { name: "Close" });
  for (let i = 0; i < 5; i++) {
    if ((await close.count()) === 0) return;
    // force + short timeout: lago animates toasts through a view transition,
    // during which the control is in the DOM but never becomes "stable", so a
    // normal click waits until the test times out. Dismissal is a convenience
    // for later clicks and never an assertion, so giving up is correct.
    try {
      await close.first().click({ force: true, timeout: 2000 });
    } catch {
      return;
    }
  }
}

/**
 * Marks an address verified directly in the test database.
 *
 * Registration deliberately does not authenticate and an unverified account
 * cannot sign in, so a test that needs a session has to clear the gate the way
 * the emailed link would. Doing it in SQL keeps the production API free of any
 * test-only bypass, and exercises the real sign-in path afterwards.
 */
export async function markEmailVerified(email: string) {
  const client = new Client({
    host: "localhost",
    port: 5434,
    user: "pokedex_user",
    password: "pokedex_password",
    database: "pokedex_test",
  });
  await client.connect();
  try {
    const res = await client.query(
      'UPDATE auth.accounts SET "emailVerified" = true WHERE email = $1',
      [email]
    );
    if (res.rowCount !== 1) {
      throw new Error(
        `expected to verify 1 row for ${email}, got ${res.rowCount}`
      );
    }
  } finally {
    await client.end();
  }
}

export async function signIn(page: Page, email: string, password: string) {
  await openSignInModal(page);
  const dialog = getAuthDialog(page);
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByPlaceholder("Enter your password").fill(password);
  await dialog.getByRole("button", { name: "Sign In" }).click();
  await expectLoggedIn(page);
  await dismissToasts(page);
}

export async function logout(page: Page) {
  await dismissToasts(page);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
}

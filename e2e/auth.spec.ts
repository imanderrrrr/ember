import { test, expect } from "@playwright/test";

test.describe("E2E: Autenticación y Acceso al Sistema", () => {
  test("Carga la página de bienvenida con branding de Ember", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=RESTAURANT OS")).toBeVisible();
    await expect(page.locator("text=EMBER").first()).toBeVisible();
  });

  test("Flujo de login completo con usuario demo y redirección al Dashboard", async ({ page }) => {
    await page.goto("/");

    // Abrir formulario
    const openBtn = page.getByRole("button", { name: /iniciar sesión/i }).first();
    await openBtn.click();

    // Rellenar campos de login directamente
    const emailInput = page.locator("input#email");
    const passwordInput = page.locator("input#password");

    await emailInput.waitFor({ state: "visible" });
    await emailInput.focus();
    await emailInput.fill("chef@ember.com");

    await passwordInput.focus();
    await passwordInput.fill("brasa2026");

    // Click en Iniciar sesión
    await page.locator('button[type="submit"]').click();

    // Redirección hacia /dashboard tras la bienvenida ceremonial
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.locator("text=Casa Olivar")).toBeVisible();
    await expect(page.locator("text=VENTAS DEL TURNO").first()).toBeVisible();
  });

  test("Rechaza credenciales erróneas con mensaje descriptivo", async ({ page }) => {
    await page.goto("/");

    const openBtn = page.getByRole("button", { name: /iniciar sesión/i }).first();
    await openBtn.click();

    const emailInput = page.locator("input#email");
    const passwordInput = page.locator("input#password");

    await emailInput.waitFor({ state: "visible" });
    await emailInput.focus();
    await emailInput.fill("usuario_inexistente@ember.com");

    await passwordInput.focus();
    await passwordInput.fill("password_erroneo_123");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Credenciales inválidas")).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from "@playwright/test";

test.describe("E2E: Salón y Gestión Visual de Mesas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const openBtn = page.getByRole("button", { name: /iniciar sesión/i }).first();
    if (await openBtn.isVisible()) {
      await openBtn.click();
    }
    const emailInput = page.locator("input#email");
    const passwordInput = page.locator("input#password");
    await emailInput.waitFor({ state: "visible" });
    await emailInput.focus();
    await emailInput.fill("chef@ember.com");
    await passwordInput.focus();
    await passwordInput.fill("brasa2026");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });
  });

  test("Carga el plano interactivo del salón con zonas y mesas", async ({ page }) => {
    await page.goto("/salon");
    await page.waitForLoadState("networkidle");

    // Verificar TopBar con el nombre del restaurante y usuario
    await expect(page.locator("text=Casa Olivar").first()).toBeVisible();
    await expect(page.locator("text=SALÓN").first()).toBeVisible();

    // Verificar selector o panel de zonas
    await expect(page.locator("text=Salón principal").first()).toBeVisible();

    // Verificar que existen mesas renderizadas en el mapa
    const table01 = page.getByRole("button", { name: /Mesa 01/i });
    await expect(table01).toBeVisible();

    // Interactuar: Seleccionar Mesa 01 y verificar panel lateral de detalle
    await table01.click();
    await expect(page.getByRole("button", { name: "Cerrar ficha" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir pedido" })).toBeVisible();
  });
});

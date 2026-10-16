import { test, expect } from "@playwright/test";

test.describe("E2E: Cocina Digital KDS (Kitchen Display System)", () => {
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
    await emailInput.fill("cocina@ember.com");
    await passwordInput.focus();
    await passwordInput.fill("brasa2026");
    await page.locator('button[type="submit"]').click();

    // El rol "cocina" aterriza automáticamente en /cocina (ver lib/roles.ts)
    await page.waitForURL("**/cocina", { timeout: 15000 });
  });

  test("Carga el tablero KDS con estaciones de cocina y brigada en línea", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Verificar encabezado de cocina
    await expect(page.locator("text=COCINA EN VIVO").or(page.locator("text=PASE DE COCINA")).or(page.locator("text=TODOS")).first()).toBeVisible();

    // Verificar botón de filtro "Todos"
    await expect(page.getByRole("button", { name: /todos/i })).toBeVisible();

    // Verificar elemento principal del tablero
    await expect(
      page
        .locator("text=Sin comandas en cocina")
        .or(page.locator("text=NUEVAS ENTRANTES"))
        .or(page.locator("text=LISTAS PARA SERVIR"))
        .first()
    ).toBeVisible();
  });
});

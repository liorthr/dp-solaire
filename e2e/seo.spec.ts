// Pages SEO : encart « Vérifier mon adresse » des guides → vérification gratuite pré-remplie.
import { expect, test } from "@playwright/test";

test("guide : l'encart adresse mène à la vérification avec l'adresse reprise", async ({ page }) => {
  await page.goto("declaration-prealable-pompe-a-chaleur/");
  await page.evaluate(() => window.localStorage.setItem("dp:providerMode", "fixtures"));
  const box = page.getByTestId("guide-quick-check");
  await expect(box).toContainText("installer une pompe à chaleur");
  await box.locator("#address").fill("Allée des Tilleuls 80480 Pont-de-Metz");
  await page.locator("#address-list button").first().click();
  await page.getByTestId("guide-quick-go").click();
  await page.waitForURL(/\/verifier\/\?w=pac/);
  // l'adresse est reprise : le parcours saute l'étape adresse et passe directement aux questions
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/unité extérieure/, { timeout: 30_000 });
});

test("guide générique : choix des travaux dans l'encart", async ({ page }) => {
  await page.goto("refus-declaration-prealable/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Refus de déclaration préalable : que faire ?");
  await expect(page.getByTestId("guide-quick-works")).toBeVisible();
  await page.getByTestId("guide-quick-works").selectOption("velux");
  await page.getByTestId("guide-quick-go").click();
  await page.waitForURL(/\/verifier\/\?w=velux/);
});

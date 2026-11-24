// Parcours « demande de permis de construire » depuis l'accueil : type de projet, questions, verdict, inscription, assistant.
import { expect, test } from "@playwright/test";

test("accueil → demande de permis de construire → verdict → inscription → assistant pré-rempli", async ({ page }, info) => {
  test.skip(info.project.name === "mobile" && !process.env.E2E_ALL, "exécuté sur le profil desktop");
  await page.goto("./");
  await page.evaluate(() => window.localStorage.setItem("dp:providerMode", "fixtures"));
  await page.selectOption("[data-testid=home-works]", "permis");
  await page.fill("#address", "Allée des Tilleuls 80480 Pont-de-Metz");
  await page.locator("#address-list button").first().click();
  await page.getByTestId("home-check").click();
  await page.waitForURL(/\/verifier\/\?w=extension&intent=pc/);
  // 1. type de projet
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Quel est votre projet ?");
  await page.getByTestId("quick-answer-pcProject").filter({ hasText: "Agrandir ma maison" }).click();
  // 2 à 4. nature, surface créée, surface existante
  await page.getByTestId("quick-answer-extKind").first().click();
  await page.getByTestId("quick-number-extAreaM2").fill("45");
  await page.getByTestId("quick-number-ok-extAreaM2").click();
  await page.getByTestId("quick-number-extExistingM2").fill("95");
  await page.getByTestId("quick-number-ok-extExistingM2").click();
  // 5 et 6. visibilité, copropriété
  await page.getByTestId("quick-answer-visible").first().click();
  await page.getByTestId("quick-answer-copropriete").first().click();
  await expect(page.getByTestId("verdict")).toContainText("permis de construire", { timeout: 60_000 });
  await expect(page.getByText("2 mois")).toBeVisible();
  await page.getByTestId("quick-prepare").click();
  await page.waitForURL(/\/connexion\/.*next=draft/);
  await page.fill("#fullname", "Camille Testeuse");
  await page.fill("#email", `camille.${Date.now()}@example.org`);
  await page.fill("#password", "Mot-de-passe-2026");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await page.waitForURL(/\/app\/nouveau\/\?draft=1/);
  await expect(page.locator("#ln")).toHaveValue("Testeuse");
  await page.getByRole("button", { name: "Continuer" }).click();
  // l'assistant reprend le projet d'agrandissement avec la surface saisie
  await expect(page.getByText(/45/).first()).toBeVisible();
});

test("demande de permis : maison neuve → information honnête et guide", async ({ page }) => {
  await page.goto("verifier/?w=extension&intent=pc");
  await page.evaluate(() => window.localStorage.setItem("dp:providerMode", "fixtures"));
  await page.fill("#address", "Allée des Tilleuls 80480 Pont-de-Metz");
  await page.locator("#address-list button").first().click();
  await page.getByTestId("quick-next").click();
  await page.getByTestId("quick-answer-pcProject").filter({ hasText: "maison neuve" }).click();
  await expect(page.getByTestId("pc-neuf")).toContainText("150 m²");
  await page.getByRole("button", { name: "C'est plutôt un agrandissement" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Qu'allez-vous construire ?");
});

test("demande de permis : bâtiment agricole → inscription professionnelle", async ({ page }) => {
  await page.goto("verifier/?w=extension&intent=pc");
  await page.fill("#address", "Allée des Tilleuls 80480 Pont-de-Metz");
  await page.locator("#address-list button").first().click();
  await page.getByTestId("quick-next").click();
  await page.getByTestId("quick-answer-pcProject").filter({ hasText: "agricole" }).click();
  await page.waitForURL(/\/connexion\/.*pro=1/);
});

test("accueil : la liste « Je veux » reste dans sa carte (ordinateur et mobile)", async ({ page }) => {
  await page.goto("./");
  for (const v of ["extension", "permis", "ite"]) {
    await page.selectOption("[data-testid=home-works]", v);
    const sel = (await page.getByTestId("home-works").boundingBox())!;
    const card = (await page.getByTestId("home-works").locator("xpath=ancestor::div[contains(@class,'rounded-[26px]')]").boundingBox())!;
    expect(sel.x + sel.width, v).toBeLessThanOrEqual(card.x + card.width);
  }
});

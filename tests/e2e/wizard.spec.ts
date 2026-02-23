import { test, expect } from "@playwright/test";

test("wizard route renders", async ({ page }) => {
  await page.goto("/property/new");
  const wizardHeading = page.getByRole("heading", { name: "Neue Immobilie anlegen" });
  const isWizardVisible = await wizardHeading.isVisible().catch(() => false);

  if (isWizardVisible) {
    await expect(page.getByText("Schritt 1/")).toBeVisible();
  } else {
    await expect(page.getByText("Bitte einloggen, um fortzufahren.")).toBeVisible();
  }
});

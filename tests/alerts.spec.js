const { test, expect } = require('@playwright/test');
const { AlertsPage } = require('../pages/AlertsPage');

test('accept JavaScript alert', async ({ page }) => {
  const alertsPage = new AlertsPage(page);
  await alertsPage.navigate();
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('alert');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Click for JS Alert' }).click();
  await expect(alertsPage.result).toHaveText('You successfully clicked an alert');
});

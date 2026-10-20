const { test, expect } = require('@playwright/test');
const { CheckboxesPage } = require('../pages/CheckboxesPage');

test('select and unselect a checkbox', async ({ page }) => {
  const checkboxPage = new CheckboxesPage(page);
  await checkboxPage.navigate();
  const firstCheckbox = checkboxPage.checkboxes.nth(0);
  await firstCheckbox.check();
  await expect(firstCheckbox).toBeChecked();
  await firstCheckbox.uncheck();
  await expect(firstCheckbox).not.toBeChecked();
});

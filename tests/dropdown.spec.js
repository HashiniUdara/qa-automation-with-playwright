const { test, expect } = require('@playwright/test');
const { DropdownPage } = require('../pages/DropdownPage');

test('select dropdown option 2', async ({ page }) => {
  const dropdownPage = new DropdownPage(page);
  await dropdownPage.navigate();
  await dropdownPage.dropdown.selectOption('2');
  await expect(dropdownPage.dropdown).toHaveValue('2');
});

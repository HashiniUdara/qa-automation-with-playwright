const { test, expect } = require('@playwright/test');
const { DynamicElementsPage } = require('../pages/DynamicElementsPage');

test('add and remove dynamic element', async ({ page }) => {
  const dynamicPage = new DynamicElementsPage(page);
  await dynamicPage.navigate();
  await dynamicPage.addButton.click();
  await expect(dynamicPage.deleteButtons).toHaveCount(1);
  await dynamicPage.deleteButtons.first().click();
  await expect(dynamicPage.deleteButtons).toHaveCount(0);
});

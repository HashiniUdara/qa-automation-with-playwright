const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { users } = require('../utils/testData');

test.describe('Form Authentication', () => {
  test('valid login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(users.valid.username, users.valid.password);
    await expect(page).toHaveURL(/\/secure(?:\/|$)/);
    await expect(loginPage.message).toContainText('You logged into a secure area!');
  });

  test('invalid username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(users.invalid.username, users.invalid.password);
    await expect(loginPage.message).toContainText('Your username is invalid!');
  });
});

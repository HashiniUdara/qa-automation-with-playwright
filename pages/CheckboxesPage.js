class CheckboxesPage {
  constructor(page) {
    this.page = page;
    this.checkboxes = page.locator('#checkboxes input[type="checkbox"]');
  }

  async navigate() {
    await this.page.goto('/checkboxes');
  }
}

module.exports = { CheckboxesPage };

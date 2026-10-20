class DropdownPage {
  constructor(page) {
    this.page = page;
    this.dropdown = page.locator('#dropdown');
  }

  async navigate() {
    await this.page.goto('/dropdown');
  }
}

module.exports = { DropdownPage };

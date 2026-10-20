class AlertsPage {
  constructor(page) {
    this.page = page;
    this.result = page.locator('#result');
  }

  async navigate() {
    await this.page.goto('/javascript_alerts');
  }
}

module.exports = { AlertsPage };

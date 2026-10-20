class DynamicElementsPage {
  constructor(page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: 'Add Element' });
    this.deleteButtons = page.getByRole('button', { name: 'Delete' });
  }

  async navigate() {
    await this.page.goto('/add_remove_elements/');
  }
}

module.exports = { DynamicElementsPage };

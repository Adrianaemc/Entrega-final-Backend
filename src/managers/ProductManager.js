import fs from 'fs/promises';
import path from 'path';

const filePath = path.resolve('src/data/products.json');

export class ProductManager {
  constructor() {
    this.path = filePath;
  }

  async _readFile() {
    try {
      const data = await fs.readFile(this.path, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async _writeFile(data) {
    await fs.writeFile(this.path, JSON.stringify(data, null, 2));
  }

  async getProducts() {
    return await this._readFile();
  }

  async getProductById(id) {
    const products = await this._readFile();
    return products.find(p => p.id === id);
  }

  async addProduct(product) {
    const products = await this._readFile();

    const newId = products.length > 0 ? Math.max(...products.map(p => Number(p.id))) + 1 : 1;
    const newProduct = { id: newId.toString(), ...product };

    products.push(newProduct);
    await this._writeFile(products);
    return newProduct;
  }

  async updateProduct(id, updates) {
    const products = await this._readFile();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    // Evitar que se actualice el ID
    delete updates.id;
    products[index] = { ...products[index], ...updates };

    await this._writeFile(products);
    return products[index];
  }

  async deleteProduct(id) {
    const products = await this._readFile();
    const updated = products.filter(p => p.id !== id);
    await this._writeFile(updated);
    return updated.length < products.length;
  }
}
import { Router } from 'express';
import { ProductManager } from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager();

// GET /api/products/ → Obtener todos los productos
router.get('/', async (req, res) => {
  const products = await productManager.getProducts();
  res.json(products);
});

// GET /api/products/:pid → Obtener un producto por ID
router.get('/:pid', async (req, res) => {
  const { pid } = req.params;
  const product = await productManager.getProductById(pid);
  product ? res.json(product) : res.status(404).json({ error: 'Producto no encontrado' });
});

// POST /api/products/ → Agregar nuevo producto
router.post('/', async (req, res) => {
  const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body;

  // Validación mínima
  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const newProduct = await productManager.addProduct({
    title,
    description,
    code,
    price,
    status,
    stock,
    category,
    thumbnails
  });

  res.status(201).json(newProduct);
});

// PUT /api/products/:pid → Actualizar un producto (menos el id)
router.put('/:pid', async (req, res) => {
  const { pid } = req.params;
  const updates = req.body;

  const updated = await productManager.updateProduct(pid, updates);
  updated
    ? res.json(updated)
    : res.status(404).json({ error: 'Producto no encontrado' });
});

// DELETE /api/products/:pid → Eliminar producto
router.delete('/:pid', async (req, res) => {
  const { pid } = req.params;
  const deleted = await productManager.deleteProduct(pid);
  deleted
    ? res.json({ message: 'Producto eliminado' })
    : res.status(404).json({ error: 'Producto no encontrado' });
});

export default router;
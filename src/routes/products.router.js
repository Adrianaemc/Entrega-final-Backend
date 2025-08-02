import { Router } from 'express';
import { Product } from '../models/Product.js';

const router = Router();

// GET /api/products/ — Con paginación, filtro y sort
router.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    let filter = {};
    if (query) {
      filter = {
        $or: [
          { category: query },
          { status: query === 'true' } // permite buscar por disponibilidad
        ]
      };
    }

    const sortOption =
      sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : {};

    const result = await Product.paginate(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOption,
      lean: true
    });

    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;

    res.json({
      status: 'success',
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage
        ? `${baseUrl}?page=${result.prevPage}&limit=${limit}`
        : null,
      nextLink: result.hasNextPage
        ? `${baseUrl}?page=${result.nextPage}&limit=${limit}`
        : null
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/products/:pid — Buscar por ID
router.get('/:pid', async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid).lean();
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'ID inválido' });
  }
});


// POST /api/products - Agregar uno o varios productos
router.post('/', async (req, res) => {
  const body = req.body;

  // Si es un array => carga masiva
  if (Array.isArray(body)) {
    try {
      const createdProducts = await Product.insertMany(body);
      return res.status(201).json({
        message: 'Productos cargados correctamente',
        products: createdProducts
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error al cargar productos', details: error.message });
    }
  }

  // Si es un solo objeto => carga individual
  const { title, description, code, price, status = true, stock, category, thumbnails = [] } = body;

  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const newProduct = await Product.create({
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails
    });
    res.status(201).json({ message: 'Producto creado', product: newProduct });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el producto', details: error.message });
  }
});


// PUT /api/products/:pid — Actualizar producto
router.put('/:pid', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.pid, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto actualizado', product: updated });
  } catch (error) {
    res.status(500).json({ error: 'ID inválido o error de actualización' });
  }
});

// DELETE /api/products/:pid — Eliminar producto
router.delete('/:pid', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.pid);
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'ID inválido o error al eliminar' });
  }
});

export default router;
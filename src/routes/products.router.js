import { Router } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

const router = Router();
const { isValidObjectId } = mongoose;

const toInt = (v, def = 1) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 1 ? def : n;
};

const buildFilter = (rawQuery) => {
  if (!rawQuery) return {};
  const q = String(rawQuery).trim();

  if (/^status\s*:\s*(true|false)$/i.test(q)) {
    const val = /true$/i.test(q);
    return { status: val };
  }
  if (/^(true|false)$/i.test(q)) {
    return { status: /^true$/i.test(q) };
  }

  return { category: q };
};

const buildSort = (sort) => {
  if (!sort) return {};
  const s = String(sort).toLowerCase();
  if (s === 'asc') return { price: 1 };
  if (s === 'desc') return { price: -1 };
  return {};
};

const pageLink = (req, page, limit) => {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.path}`);
  // conservar query params
  const params = req.query || {};
  Object.entries(params).forEach(([k, v]) => {
    if (k !== 'page' && k !== 'limit') url.searchParams.set(k, v);
  });
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  return url.toString();
};

router.get('/', async (req, res) => {
  try {
    const limit = toInt(req.query.limit, 10);
    const page = toInt(req.query.page, 1);
    const filter = buildFilter(req.query.query);
    const sortOption = buildSort(req.query.sort);

    
    const result = await Product.paginate(filter, {
      page,
      limit,
      sort: sortOption,
      lean: true
    });

    res.json({
      status: 'success',
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? pageLink(req, result.prevPage, limit) : null,
      nextLink: result.hasNextPage ? pageLink(req, result.nextPage, limit) : null
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener productos' });
  }
});

router.get('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    if (!isValidObjectId(pid)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const product = await Product.findById(pid).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    console.error('GET /api/products/:pid error:', error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});


router.post('/', async (req, res) => {
  const body = req.body;

  // CARGA MASIVA
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return res.status(400).json({ error: 'El array de productos está vacío' });
    }
    // Validación mínima por cada item
    const missing = body.findIndex(p =>
      !p?.title || !p?.description || !p?.code || p?.price == null || p?.stock == null || !p?.category
    );
    if (missing !== -1) {
      return res.status(400).json({ error: `Producto #${missing + 1} con campos faltantes` });
    }

    try {
      const created = await Product.insertMany(body);
      return res.status(201).json({ message: 'Productos creados', products: created });
    } catch (error) {
      console.error('Bulk insert error:', error);
      return res.status(500).json({ error: 'Error al crear productos', details: error.message });
    }
  }

  // CARGA INDIVIDUAL
  const {
    title,
    description,
    code,
    price,
    status = true,
    stock,
    category,
    thumbnails = []
  } = body;

  if (!title || !description || !code || price == null || stock == null || !category) {
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
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error al crear el producto', details: error.message });
  }
});


router.put('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    if (!isValidObjectId(pid)) {
      return res.status(400).json({ error: 'ID inválido' });
    }


    if ('_id' in req.body) delete req.body._id;

    const updated = await Product.findByIdAndUpdate(pid, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto actualizado', product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});


router.delete('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    if (!isValidObjectId(pid)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const deleted = await Product.findByIdAndDelete(pid);
    if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

export default router;
import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';

const router = Router();

// Ruta home (opcional)
router.get('/', (req, res) => {
  res.render('home', { title: 'Bienvenida' });
});

// GET /products → lista paginada con páginas numeradas
router.get('/products', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    // Filtro por categoría o estado
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { category: { $regex: query, $options: 'i' } },
          { status: query === 'true' }
        ]
      };
    }

    // Orden por precio
    const sortOption =
      sort === 'asc' ? { price: 1 } :
      sort === 'desc' ? { price: -1 } :
      {};

    // Paginación
    const result = await Product.paginate(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOption,
      lean: true
    });

    // Array de páginas [1..totalPages]
    const pages = [];
    for (let i = 1; i <= result.totalPages; i++) {
      pages.push(i);
    }

    res.render('products', {
      title: 'Listado de Productos',
      products: result.docs,
      page: result.page,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      pages
    });
  } catch (err) {
    res.status(500).send('Error al cargar productos');
  }
});

// GET /carts/:cid → vista carrito
router.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid)
                           .populate('products.product')
                           .lean();
    if (!cart) return res.status(404).send('Carrito no encontrado');
    res.render('cart', { title: 'Tu Carrito', cart });
  } catch {
    res.status(500).send('Error al obtener carrito');
  }
});

export default router;
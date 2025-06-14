import { Router } from 'express';
import { CartManager } from '../managers/CartManager.js';

const router = Router();
const cartManager = new CartManager();

// POST /api/carts para Crear un nuevo carrito
router.post('/', async (req, res) => {
  const newCart = await cartManager.createCart();
  res.status(201).json(newCart);
});

// GET /api/carts/:cid  Ver contenido de un carrito
router.get('/:cid', async (req, res) => {
  const { cid } = req.params;
  const cart = await cartManager.getCartById(cid);

  cart
    ? res.json(cart)
    : res.status(404).json({ error: 'Carrito no encontrado' });
});

// POST /api/carts/:cid/product/:pid  Agregar producto a carrito
router.post('/:cid/product/:pid', async (req, res) => {
  const { cid, pid } = req.params;
  const updatedCart = await cartManager.addProductToCart(cid, pid);

  updatedCart
    ? res.json(updatedCart)
    : res.status(404).json({ error: 'Carrito no encontrado' });
});

export default router;
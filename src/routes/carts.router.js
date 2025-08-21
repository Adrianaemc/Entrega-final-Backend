// src/routes/carts.router.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

const router = Router();
const { isValidObjectId } = mongoose;

/* ---------- helpers ---------- */
const ensureObjectId = (id, name = 'id') => {
  if (!isValidObjectId(id)) {
    const err = new Error(`${name} inválido`);
    err.status = 400;
    throw err;
  }
};

const parseQuantity = (q) => {
  if (q === undefined) return 1;
  const n = Number(q);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error('La cantidad debe ser un entero positivo');
    err.status = 400;
    throw err;
  }
  return n;
};

/* ---------- POST /api/carts  → Crear carrito vacío ---------- */
router.post('/', async (req, res) => {
  try {
    const newCart = await Cart.create({ products: [] });
    res.status(201).json(newCart);
  } catch (err) {
    console.error('Create cart error:', err);
    res.status(500).json({ error: 'Error al crear el carrito' });
  }
});

/* ---------- GET /api/carts/:cid  → Obtener carrito con populate ---------- */
router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    ensureObjectId(cid, 'cid');

    const cart = await Cart.findById(cid).populate('products.product');
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    res.json(cart);
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Error al obtener el carrito' });
  }
});

/* ---------- POST /api/carts/:cid/products/:pid  → Agregar producto con validaciones ---------- */
router.post('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    ensureObjectId(cid, 'cid');
    ensureObjectId(pid, 'pid');

    // 1) Carrito debe existir
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    // 2) Producto debe existir
    const product = await Product.findById(pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    // (opcional) si usás status para disponibilidad
    if (product.status === false) {
      return res.status(400).json({ error: 'Producto inactivo/no disponible' });
    }

    // 3) quantity desde body (default 1) y validación
    const quantity = parseQuantity(req.body.quantity);

    // 4) Validar stock suficiente contra el TOTAL en carrito
    const idx = cart.products.findIndex(p => p.product.toString() === pid);
    const currentQty = idx >= 0 ? cart.products[idx].quantity : 0;
    const newTotal = currentQty + quantity;

    if (product.stock < newTotal) {
      return res.status(400).json({
        error: 'Stock insuficiente',
        detalle: `Stock: ${product.stock}, en carrito: ${currentQty}, solicitado: +${quantity}`
      });
    }

    // 5) Agregar o acumular
    if (idx >= 0) {
      cart.products[idx].quantity = newTotal;
    } else {
      cart.products.push({ product: product._id, quantity });
    }

    await cart.save();

    const populated = await Cart.findById(cid).populate('products.product');
    res.json({ message: 'Producto agregado al carrito', cart: populated });
  } catch (error) {
    console.error('Add product to cart error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error al agregar el producto al carrito' });
  }
});

/* ---------- DELETE /api/carts/:cid/products/:pid  → Eliminar un producto del carrito ---------- */
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    ensureObjectId(cid, 'cid');
    ensureObjectId(pid, 'pid');

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const before = cart.products.length;
    cart.products = cart.products.filter(p => p.product.toString() !== pid);

    if (cart.products.length === before) {
      return res.status(404).json({ error: 'El producto no estaba en el carrito' });
    }

    await cart.save();
    const populated = await Cart.findById(cid).populate('products.product');
    res.json({ message: 'Producto eliminado del carrito', cart: populated });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Error al eliminar el producto' });
  }
});

/* ---------- DELETE /api/carts/:cid  → Vaciar carrito ---------- */
router.delete('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    ensureObjectId(cid, 'cid');

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.products = [];
    await cart.save();

    res.json({ message: 'Carrito vaciado' });
  } catch (err) {
    console.error('Empty cart error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Error al vaciar el carrito' });
  }
});

export default router;
import express from 'express';
import { engine } from 'express-handlebars';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import viewsRouter from './src/routes/views.router.js';
import productsRouter from './src/routes/products.router.js';
import cartsRouter from './src/routes/carts.router.js';
import { ProductManager } from './src/managers/ProductManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views'));

// Rutas
app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Servidor
const httpServer = app.listen(PORT, () =>
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`)
);

// Socket.io
const io = new Server(httpServer);
const productManager = new ProductManager();

io.on('connection', async socket => {
  console.log('🟢 Cliente conectado');

  const products = await productManager.getProducts();
  socket.emit('productList', products);

  socket.on('addProduct', async data => {
    await productManager.addProduct(data);
    const updated = await productManager.getProducts();
    io.emit('productList', updated);
  });

  socket.on('deleteProduct', async id => {
    await productManager.deleteProduct(id);
    const updated = await productManager.getProducts();
    io.emit('productList', updated);
  });
});
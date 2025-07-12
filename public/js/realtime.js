const socket = io();

const form = document.getElementById('productForm');
const list = document.getElementById('productList');

form.addEventListener('submit', e => {
  e.preventDefault();

  const product = {
    title: form.title.value,
    price: parseFloat(form.price.value),
    description: form.description.value,
    code: form.code.value,
    stock: parseInt(form.stock.value),
    category: form.category.value,
    status: true,
    thumbnails: form.thumbnail.value ? [form.thumbnail.value] : []
  };

  socket.emit('addProduct', product);
  form.reset();
});

socket.on('productList', products => {
  list.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.style.border = '1px solid #ccc';
    card.style.padding = '10px';
    card.style.borderRadius = '8px';
    card.style.width = '200px';
    card.style.boxShadow = '0 0 5px rgba(0,0,0,0.1)';
    card.style.textAlign = 'center';
    card.style.backgroundColor = '#f9f9f9';

    card.innerHTML = `
      ${p.thumbnails[0] ? `<img src="${p.thumbnails[0]}" alt="img" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">` : ''}
      <h3 style="margin:10px 0 5px;">${p.title}</h3>
      <p style="margin: 0;">$${p.price}</p>
      <button data-id="${p.id}" style="margin-top:10px;">❌ Eliminar</button>
    `;

    list.appendChild(card);
  });

  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      socket.emit('deleteProduct', id);
    });
  });
});
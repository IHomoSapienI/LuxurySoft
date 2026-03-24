import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';  // Importar useNavigate para la redirección

const ProductsGrid = () => {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();  // Instancia de useNavigate

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const response = await axios.get('https://gitbf.onrender.com/api/productos');  // Cambiamos la URL para productos
        setProductos(response.data.productos);
      } catch (error) {
        console.error('Error al obtener los productos:', error);
      }
    };

    obtenerProductos();
  }, []);

  const baseUrl = 'https://gitbf.onrender.com/uploads'; // URL base para las imágenes

  // Función para manejar el clic y redirigir a la página de detalle de producto
  const manejarClickProducto = (producto) => {
    navigate('/detalle-producto', { state: { producto } }); // Pasamos el producto como estado
  };

  return (
    <div className="container my-12 mx-auto px-4 md:px-12">
      <div className="flex flex-wrap -mx-1 lg:-mx-4">
        {productos.map((producto) => (
          <div
            key={producto._id}
            className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
          >
            <article
              className="overflow-hidden rounded-lg shadow-lg cursor-pointer"
              onClick={() => manejarClickProducto(producto)} // Llamamos a la función al hacer clic
            >
              <img
                alt={producto.nombreProducto}
                className="block img-size"
                src={`${baseUrl}/${producto.imagenUrl}`} // Usamos la imagen del producto
              />

              <header className="flex items-center justify-between leading-tight p-2 md:p-4">
                <h1 className="text-lg">
                  <a className="no-underline hover:underline text-black" href="#">
                    {producto.nombreProducto}
                  </a>
                </h1>
                <p className="text-grey-darker text-sm">${producto.precio}</p>
              </header>

              <div className="p-2 md:p-4">
                <p className="text-grey-darker text-sm">{producto.descripcion || 'Descripción no disponible'}</p>
              </div>

              <footer className="flex items-center justify-between leading-none p-2 md:p-4">
                <p className="ml-2 text-sm">{producto.categoria.nombreCategoria}</p>
                <span className="text-grey-darker">{producto.stock} en stock</span>
              </footer>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsGrid;

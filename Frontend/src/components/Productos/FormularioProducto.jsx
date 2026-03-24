"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes, faBox, faImage, faInfoCircle } from "@fortawesome/free-solid-svg-icons"

const FormularioProducto = ({ producto, onClose, onProductoActualizado }) => {
  const [formData, setFormData] = useState({
    nombreProducto: "",
    categoria: "",
    stock: "",
    precio: "",
    descripcion: "",
    estado: true,
    imagen: null,
  })

  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    nombreProducto: "",
    categoria: "",
    stock: "",
    precio: "",
    descripcion: "",
    imagen: "",
  })

  // Funciones de validación del lado del cliente
  const validarNombreProducto = (nombre) => {
    if (!nombre || nombre.trim() === "") {
      return "El nombre del producto es requerido"
    }

    const nombreTrimmed = nombre.trim()

    if (nombreTrimmed.length < 3 || nombreTrimmed.length > 20) {
      return "El nombre debe tener entre 3 y 20 caracteres"
    }

    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/
    if (!regex.test(nombreTrimmed)) {
      return "Solo se permiten letras, números y espacios"
    }

    return ""
  }

  const validarStock = (stock) => {
    if (!stock || stock.trim() === "") {
      return "El stock es requerido"
    }

    const stockNum = Number(stock)

    if (isNaN(stockNum)) {
      return "El stock debe ser un número válido"
    }

    if (!Number.isInteger(stockNum)) {
      return "El stock debe ser un número entero"
    }

    if (stockNum < 1) {
      return "El stock debe ser mayor o igual a 1"
    }

    return ""
  }

  const validarPrecio = (precio) => {
    if (!precio || precio.trim() === "") {
      return "El precio es requerido"
    }

    const precioNum = Number(precio)

    if (isNaN(precioNum)) {
      return "El precio debe ser un número válido"
    }

    if (precioNum <= 0) {
      return "El precio debe ser mayor que cero"
    }

    const decimales = (precio.split(".")[1] || "").length
    if (decimales > 2) {
      return "El precio puede tener máximo 2 decimales"
    }

    return ""
  }

  const validarDescripcion = (descripcion) => {
    if (descripcion && descripcion.trim() !== "") {
      const descripcionTrimmed = descripcion.trim()

      if (descripcionTrimmed.length > 300) {
        return "La descripción no puede exceder los 300 caracteres"
      }

      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()¿?¡!-]+$/
      if (!regex.test(descripcionTrimmed)) {
        return "La descripción contiene caracteres no válidos"
      }
    }

    return ""
  }

  const validarCategoria = (categoria) => {
    if (!categoria || categoria.trim() === "") {
      return "Debe seleccionar una categoría"
    }
    return ""
  }

  const validarImagen = (imagen, esEdicion) => {
    if (!esEdicion && !imagen) {
      return "La imagen del producto es requerida"
    }

    if (imagen) {
      const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
      if (!tiposPermitidos.includes(imagen.type)) {
        return "Solo se permiten imágenes JPG, PNG o GIF"
      }

      const tamañoMaximo = 5 * 1024 * 1024 // 5MB
      if (imagen.size > tamañoMaximo) {
        return "La imagen no puede ser mayor a 5MB"
      }
    }

    return ""
  }

  useEffect(() => {
    const obtenerCategorias = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
            confirmButtonColor: "#db2777",
          })
          return
        }

        const respuesta = await axios.get("https://gitbf.onrender.com/api/categoriaproductos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const categoriasData = Array.isArray(respuesta.data) ? respuesta.data : respuesta.data.categorias || []
        setCategorias(categoriasData)
      } catch (error) {
        console.error("Error al obtener las categorías:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las categorías",
          confirmButtonColor: "#db2777",
        })
      }
    }

    obtenerCategorias()
  }, [])

  useEffect(() => {
    if (producto) {
      setFormData({
        nombreProducto: producto.nombreProducto || "",
        categoria: producto.categoria ? producto.categoria._id : "",
        stock: producto.stock?.toString() || "",
        precio: producto.precio?.toString() || "",
        descripcion: producto.descripcion || "",
        estado: producto.estado !== undefined ? producto.estado : true,
        imagen: null,
      })
    }
  }, [producto])

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target
    let newValue = value

    if (type === "checkbox") {
      newValue = checked
    } else if (type === "file") {
      newValue = files ? files[0] : null
    }

    // Validación en tiempo real
    let errorMessage = ""
    if (name === "nombreProducto") {
      errorMessage = validarNombreProducto(newValue)
    } else if (name === "categoria") {
      errorMessage = validarCategoria(newValue)
    } else if (name === "stock") {
      errorMessage = validarStock(newValue)
    } else if (name === "precio") {
      errorMessage = validarPrecio(newValue)
    } else if (name === "descripcion") {
      errorMessage = validarDescripcion(newValue)
    } else if (name === "imagen") {
      errorMessage = validarImagen(newValue, !!producto)
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMessage,
    })

    if (name === "estado") {
      setFormData({
        ...formData,
        [name]: value === "Activo",
      })
    } else {
      setFormData({
        ...formData,
        [name]: newValue,
      })
    }
  }

  const validateForm = () => {
    const errors = {
      nombreProducto: validarNombreProducto(formData.nombreProducto),
      categoria: validarCategoria(formData.categoria),
      stock: validarStock(formData.stock),
      precio: validarPrecio(formData.precio),
      descripcion: validarDescripcion(formData.descripcion),
      imagen: validarImagen(formData.imagen, !!producto),
    }

    setFieldErrors(errors)

    return !Object.values(errors).some((error) => error !== "")
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Por favor corrige los errores en el formulario",
        confirmButtonColor: "#db2777",
      })
      return
    }

    setLoading(true)
    setError(null)

    const data = new FormData()
    data.append("nombreProducto", formData.nombreProducto.trim())
    data.append("categoria", formData.categoria)
    data.append("stock", formData.stock)
    data.append("precio", formData.precio)
    data.append("descripcion", formData.descripcion.trim())
    data.append("estado", formData.estado.toString())

    if (formData.imagen) {
      data.append("imagen", formData.imagen)
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
          confirmButtonColor: "#db2777",
        })
        return
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }

      if (producto) {
        await axios.put(`https://gitbf.onrender.com/api/productos/${producto._id}`, data, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto actualizado correctamente",
          confirmButtonColor: "#db2777",
        })
      } else {
        await axios.post("https://gitbf.onrender.com/api/productos", data, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto creado correctamente",
          confirmButtonColor: "#db2777",
        })
      }

      // Llamar a la función de callback para actualizar la tabla
      if (onProductoActualizado) {
        onProductoActualizado()
      }

      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = error.response?.data?.msg || "Hubo un problema al guardar el producto"
      setError(errorMessage)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#db2777",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 w-full mx-auto" style={{ maxWidth: "95%", minWidth: "900px" }}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        <FontAwesomeIcon icon={faBox} className="mr-2" />
        {producto ? "Editar Producto" : "Nuevo Producto"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-6">
        {/* Información básica del producto */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />📋 Información Básica del Producto
          </h3>

          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="nombreProducto" className="form-label">
                Nombre del Producto <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                id="nombreProducto"
                name="nombreProducto"
                value={formData.nombreProducto}
                onChange={handleInputChange}
                maxLength={20}
                className={`form-input w-full ${fieldErrors.nombreProducto ? "border-red-500" : ""}`}
                placeholder="Ingrese el nombre del producto (3-20 caracteres)"
              />
              {fieldErrors.nombreProducto && <p className="text-red-500 text-sm mt-1">{fieldErrors.nombreProducto}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.nombreProducto.length}/20 caracteres</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="categoria" className="form-label">
                  Categoría <span className="text-pink-500">*</span>
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className={`form-input w-full ${fieldErrors.categoria ? "border-red-500" : ""}`}
                >
                  <option value="">
                    {categorias.length === 0 ? "No hay categorías disponibles" : "Seleccione una categoría"}
                  </option>
                  {categorias.map((categoria) => (
                    <option key={categoria._id} value={categoria._id}>
                      {categoria.nombreCp}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoria && <p className="text-red-500 text-sm mt-1">{fieldErrors.categoria}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="estado" className="form-label">
                  Estado <span className="text-pink-500">*</span>
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado ? "Activo" : "Inactivo"}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Información de inventario y precio */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">💰 Inventario y Precio</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="stock" className="form-label">
                Stock <span className="text-pink-500">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="1"
                step="1"
                className={`form-input w-full ${fieldErrors.stock ? "border-red-500" : ""}`}
                placeholder="Cantidad en stock"
              />
              {fieldErrors.stock && <p className="text-red-500 text-sm mt-1">{fieldErrors.stock}</p>}
              <p className="text-xs text-gray-500 mt-1">Cantidad disponible en inventario</p>
            </div>

            <div className="form-group">
              <label htmlFor="precio" className="form-label">
                Precio <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  className={`form-input w-full pl-8 ${fieldErrors.precio ? "border-red-500" : ""}`}
                  placeholder="0.00"
                />
              </div>
              {fieldErrors.precio && <p className="text-red-500 text-sm mt-1">{fieldErrors.precio}</p>}
              <p className="text-xs text-gray-500 mt-1">Precio de venta del producto</p>
            </div>
          </div>
        </div>

        {/* Descripción del producto */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">📝 Descripción del Producto</h3>

          <div className="form-group">
            <label htmlFor="descripcion" className="form-label">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              maxLength={300}
              className={`form-input w-full resize-none ${fieldErrors.descripcion ? "border-red-500" : ""}`}
              rows={4}
              placeholder="Ingrese una descripción detallada del producto (opcional)"
            />
            {fieldErrors.descripcion && <p className="text-red-500 text-sm mt-1">{fieldErrors.descripcion}</p>}
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Descripción opcional del producto</p>
              <p className="text-xs text-gray-500">{formData.descripcion.length}/300 caracteres</p>
            </div>
          </div>
        </div>

        {/* Imagen del producto */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            <FontAwesomeIcon icon={faImage} className="mr-2" />
            🖼️ Imagen del Producto
          </h3>

          <div className="form-group">
            <label htmlFor="imagen" className="form-label">
              Imagen del Producto {!producto && <span className="text-pink-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition-colors bg-white">
              <input
                type="file"
                id="imagen"
                name="imagen"
                onChange={handleInputChange}
                accept="image/jpeg,image/jpg,image/png,image/gif"
                className="hidden"
              />
              <label htmlFor="imagen" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faImage} className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {formData.imagen ? formData.imagen.name : "Haz clic para seleccionar una imagen"}
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF hasta 5MB</p>
                  </div>
                </div>
              </label>
            </div>
            {fieldErrors.imagen && <p className="text-red-500 text-sm mt-1">{fieldErrors.imagen}</p>}
          </div>
        </div>

        {/* Resumen del producto */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-pink-800 mb-3">📊 Resumen del Producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-pink-700">
            <div>
              <span className="font-medium">Nombre:</span>
              <span className="ml-2 font-bold">{formData.nombreProducto || "Sin nombre"}</span>
            </div>
            <div>
              <span className="font-medium">Stock:</span>
              <span className="ml-2 font-bold">{formData.stock || "0"} unidades</span>
            </div>
            <div>
              <span className="font-medium">Precio:</span>
              <span className="ml-2 font-bold text-lg text-pink-800">${formData.precio || "0.00"}</span>
            </div>
          </div>
        </div>

        <div className="btn-container mt-6 flex justify-end space-x-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {producto ? "Actualizar Producto" : "Crear Producto"}
              </>
            )}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default FormularioProducto

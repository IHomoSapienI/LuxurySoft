"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"

const FormularioCategoriaProducto = ({ categoriaId, onClose }) => {
  const [nombreCp, setNombreCp] = useState("")
  const [descripcionCp, setDescripcionCp] = useState("")
  const [activo, setActivo] = useState(true)
  const apiUrl = "https://gitbf.onrender.com/api/categoriaproductos"

  // Estados para errores de validación
  const [errores, setErrores] = useState({
    nombreCp: "",
    descripcionCp: "",
  })

  useEffect(() => {
    if (categoriaId) {
      // Cargar datos de la categoría si se está editando
      const fetchCategoria = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
          await Swal.fire("Error", "No se encontró el token de autenticación. Por favor, inicia sesión.", "error")
          return
        }

        try {
          const response = await axios.get(`${apiUrl}/${categoriaId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          const categoria = response.data.categoria
          setNombreCp(categoria.nombreCp)
          setDescripcionCp(categoria.descripcionCp)
          setActivo(categoria.activo)
        } catch (error) {
          console.error("Error al cargar la categoría:", error)
          Swal.fire("Error", "No se pudo cargar la categoría", "error")
        }
      }
      fetchCategoria()
    }
  }, [categoriaId])

  // Función para validar el nombre de categoría
  const validarNombreCategoria = (nombre) => {
    if (!nombre || nombre.trim() === "") {
      return "El nombre de categoría no puede estar vacío"
    }

    if (nombre.length < 3 || nombre.length > 20) {
      return "El nombre de categoría debe tener entre 3 y 20 caracteres"
    }

    // Verificar si solo contiene caracteres especiales
    if (/^[^a-zA-Z0-9]+$/.test(nombre)) {
      return "El nombre de categoría no puede contener solo caracteres especiales"
    }

    // Verificar si contiene al menos una letra
    if (!/[a-zA-Z]/.test(nombre)) {
      return "El nombre de categoría debe contener al menos una letra"
    }

    return ""
  }

  // Función para validar la descripción
  const validarDescripcion = (descripcion) => {
    // La descripción puede estar vacía
    if (descripcion === undefined || descripcion === null || descripcion.trim() === "") {
      return ""
    }

    if (descripcion.length > 300) {
      return "La descripción no puede exceder los 300 caracteres"
    }

    // Verificar si solo contiene números
    if (/^\d+$/.test(descripcion)) {
      return "La descripción no puede contener solo números"
    }

    // Verificar si solo contiene caracteres especiales
    if (/^[^a-zA-Z0-9]+$/.test(descripcion)) {
      return "La descripción no puede contener solo caracteres especiales"
    }

    return ""
  }

  // Validar campos al cambiar
  const handleNombreChange = (e) => {
    const valor = e.target.value
    setNombreCp(valor)
    setErrores({
      ...errores,
      nombreCp: validarNombreCategoria(valor),
    })
  }

  const handleDescripcionChange = (e) => {
    const valor = e.target.value
    setDescripcionCp(valor)
    setErrores({
      ...errores,
      descripcionCp: validarDescripcion(valor),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar todos los campos antes de enviar
    const errorNombre = validarNombreCategoria(nombreCp)
    const errorDescripcion = validarDescripcion(descripcionCp)

    // Actualizar errores
    setErrores({
      nombreCp: errorNombre,
      descripcionCp: errorDescripcion,
    })

    // Si hay errores, no enviar el formulario
    if (errorNombre || errorDescripcion) {
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      await Swal.fire("Error", "No se encontró el token de autenticación. Por favor, inicia sesión.", "error")
      return
    }

    // Datos de la categoría a enviar
    const categoriaData = {
      nombreCp,
      descripcionCp,
      activo,
    }

    try {
      if (categoriaId) {
        // Actualizar categoría existente
        await axios.put(`${apiUrl}/${categoriaId}`, categoriaData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        Swal.fire("¡Éxito!", "Categoría actualizada con éxito", "success")
      } else {
        // Crear nueva categoría
        await axios.post(apiUrl, categoriaData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        Swal.fire("¡Éxito!", "Categoría creada con éxito", "success")
      }
      // console.log("Formulario enviado, actualizando categorías...")
      onClose() // Cerrar el formulario y actualizar la tabla
    } catch (error) {
      console.error("Error al guardar la categoría:", error)

      // Mostrar mensaje de error del servidor si está disponible
      const mensajeError = error.response?.data?.msg || "No se pudo guardar la categoría"
      Swal.fire("Error", mensajeError, "error")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre de la Categoría:</label>
        <input
          type="text"
          value={nombreCp}
          onChange={handleNombreChange}
          className={`mt-1 block w-full px-3 py-2 border ${errores.nombreCp ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500`}
        />
        {errores.nombreCp && <p className="mt-1 text-sm text-red-600">{errores.nombreCp}</p>}
        <p className="mt-1 text-xs text-gray-500">
          El nombre debe tener entre 3 y 20 caracteres y contener al menos una letra.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción:</label>
        <textarea
          value={descripcionCp}
          onChange={handleDescripcionChange}
          className={`mt-1 block w-full px-3 py-2 border ${errores.descripcionCp ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500`}
        />
        {errores.descripcionCp && <p className="mt-1 text-sm text-red-600">{errores.descripcionCp}</p>}
        <p className="mt-1 text-xs text-gray-500">
          La descripción debe tener menos de 300 caracteres y no puede contener solo números o caracteres especiales.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Estado:</label>
        <select
          value={activo}
          onChange={(e) => setActivo(e.target.value === "true")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </div>
      <div className="flex justify-between mt-4">
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          disabled={errores.nombreCp || errores.descripcionCp}
        >
          {categoriaId ? "Actualizar Categoría" : "Agregar Categoría"}
        </button>
        <button
          type="button"
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </form>
  )
}

export default FormularioCategoriaProducto
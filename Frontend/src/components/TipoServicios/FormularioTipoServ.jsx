"use client"

import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons"
import Swal from "sweetalert2"

export default function FormularioTipoServicios({ tipoServicioSeleccionado, onTipoServicioActualizado, onClose }) {
  const [formData, setFormData] = useState({
    nombreTipoServicio: "",
    activo: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tipoServicioSeleccionado) {
      setFormData({
        nombreTipoServicio: tipoServicioSeleccionado.nombreTipoServicio || "",
        activo: tipoServicioSeleccionado.activo !== undefined ? tipoServicioSeleccionado.activo : true,
      })
    } else {
      setFormData({
        nombreTipoServicio: "",
        activo: true,
      })
    }
  }, [tipoServicioSeleccionado])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

    const nombre = formData.nombreTipoServicio.trim()
    //Expresion regular usada en el backend para validar el nombre del tipo de servicio
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    if (!nombre){
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "El nombre del tipo de servicio no puede estar vacío.",
        confirmButtonColor: "#db2777",
      })
      setLoading(false)
      return
    }
    if(nombre.length < 3 || nombre.length > 50){
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "El nombre del tipo de servicio debe tener entre 3 y 50 caracteres.",
        confirmButtonColor: "#db2777",
      })
      setLoading(false)
      return
    }
    if(!nombreRegex.test(nombre)){
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "El nombre del tipo de servicio solo puede contener letras , tildesy espacios.",
        confirmButtonColor: "#db2777",
      })
      setLoading(false)
      return
    }
    if(/^\d+$/.test(nombre)){
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "El nombre del tipo de servicio no puede ser solo números.",
        confirmButtonColor: "#db2777",
      })
      setLoading(false)
      return
    }
    const esCadenaRepetida = (str) => { 
      const len = str.length
      for (let i = 1; i <= len / 2; i++) {
        const sub = str.slice(0, i)
        if (sub.repeat(len / i) === str) {
          return true
        }
      }
      return false
    }
    if (esCadenaRepetida(nombre)) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "El nombre del tipo de servicio no puede ser una cadena repetida.",
        confirmButtonColor: "#db2777",
      })
      setLoading(false)
      return
    }
  try {
    const token = localStorage.getItem("token")
    const url = tipoServicioSeleccionado
      ? `https://gitbf.onrender.com/api/tiposervicioss/${tipoServicioSeleccionado._id}`
      : "https://gitbf.onrender.com/api/tiposervicioss"

    const method = tipoServicioSeleccionado ? "PUT" : "POST"

    // // 👉 Log para verificar datos antes de enviar
    // console.log("Datos enviados:", formData)
    // console.log("Usando método:", method)
    // console.log("URL:", url)

    const response = await fetch(url, {
  method,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(formData),
});

// Log para ver si al menos hay respuesta
// console.log("HTTP Status:", response.status);

// Evita intentar parsear JSON si la respuesta no tiene contenido
if (response.status === 204) {
  console.warn("La API respondió 204 No Content");
  Swal.fire({
    icon: "warning",
    title: "Sin contenido",
    text: "La API no devolvió ningún dato.",
  });
  return;
}

const data = await response.json();
// console.log("Respuesta completa:", data);


    // Validación extra por si el backend no devuelve lo esperado
    if (!data.tiposerviciots) {
      console.warn("Advertencia: 'tiposerviciots' no está en la respuesta", data)
    }


    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.msg || "No se pudo guardar el tipo de servicio",
        confirmButtonColor: "#db2777",
      })
      setLoading(false)
      return
    }

    onTipoServicioActualizado(data.tiposerviciots)

    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: tipoServicioSeleccionado
        ? "Tipo de servicio actualizado correctamente"
        : "Tipo de servicio creado correctamente",
      confirmButtonColor: "#db2777",
    })
  } catch (error) {
    console.error("Error al guardar el tipo de servicio:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el tipo de servicio",
      confirmButtonColor: "#db2777",
    })
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="p-6 max-w-[100%] mx-auto bg-white rounded-lg shadow-md dark:bg-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-center text-black">
        {tipoServicioSeleccionado ? "Editar Tipo de Servicio" : "Nuevo Tipo de Servicio"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombreTipoServicio" className="block text-sm font-medium text-black">
            Nombre del Tipo de Servicio
          </label>
          <input
            type="text"
            id="nombreTipoServicio"
            name="nombreTipoServicio"
            minLength={3}
            maxLength={50}
            title="El nombre del tipo de servicio debe tener entre 3 y 50 caracteres."
            value={formData.nombreTipoServicio}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500  dark:border-zinc-600 "
            placeholder="Ingrese el nombre del tipo de servicio"
          />
        </div>

        <div className="flex items-center ">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
          />
          <label htmlFor="activo" className="ml-2 block text-sm text-black">
            Activo
          </label>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-zinc-600 dark:text-white dark:hover:bg-zinc-500"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-pink-700 dark:hover:bg-pink-800"
          >
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  )
}

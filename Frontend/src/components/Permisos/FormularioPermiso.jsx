"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FaSpinner } from "react-icons/fa"
import "./formularioPermisos.css"

const FormularioPermiso = ({ permisoSeleccionado, editMode, onClose, onPermisoCreated }) => {
  const [formData, setFormData] = useState({
    nombrePermiso: "",
    descripcion: "",
    activo: true,
    categoria: "",
    nivel: "read",
  })
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (editMode && permisoSeleccionado) {
      setFormData({
        nombrePermiso: permisoSeleccionado.nombrePermiso || "",
        descripcion: permisoSeleccionado.descripcion || "",
        activo: permisoSeleccionado.activo !== undefined ? permisoSeleccionado.activo : true,
        categoria: permisoSeleccionado.categoria || "",
        nivel: permisoSeleccionado.nivel || "read",
      })
    }
  }, [editMode, permisoSeleccionado])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      const token = localStorage.getItem("token")
      let response

      if (editMode && permisoSeleccionado) {
        // Actualizar permiso existente
        response = await axios.put(`https://gitbf.onrender.com/api/permisos/${permisoSeleccionado._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        Swal.fire({
          icon: "success",
          title: "Permiso actualizado exitosamente",
          showConfirmButton: false,
          timer: 1500,
        })
      } else {
        // console.log("Datos enviados:", formData)

        // Crear nuevo permiso
        response = await axios.post("https://gitbf.onrender.com/api/permisos", formData, 
          {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        Swal.fire({
          icon: "success",
          title: "Permiso creado exitosamente",
          showConfirmButton: false,
          timer: 1500,
        })
      }

      if (onPermisoCreated) {
        onPermisoCreated(response.data)
      }
      onClose()
    } catch (error) {
      console.error("Error al guardar el permiso:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.msg || "No se pudo guardar el permiso. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="formulario-moderno-perm bg-white rounded-lg max-w-[100%] max-h-[60vh] overflow-y-scroll">
      <div className="form-group">
        <label htmlFor="nombrePermiso" className="form-label">
          Nombre del Permiso: <span className="text-pink-500">*</span>
        </label>
        <input
          type="text"
          id="nombrePermiso"
          name="nombrePermiso"
          value={formData.nombrePermiso}
          onChange={handleChange}
          required
          minLength={5}
          maxLength={30}
          className="form-input"
          placeholder="Ejemplo: crearUsuarios, verRoles, eliminarProductos"
        />
        <p className="text-xs text-gray-500 mt-1">Ejemplo: crearUsuarios, verRoles, eliminarProductos.</p>
      </div>

      <div className="form-group">
        <label htmlFor="descripcion" className="form-label">
          Descripción <span className="text-pink-500">*</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          required
          minLength={10}
          maxLength={80}
          rows={1}
          className="form-textarea"
          placeholder="Descripción detallada del permiso"
        />
      </div>

      <div className="form-group">
        <label htmlFor="categoria" className="form-label">
          Categoría <span className="text-pink-500">*</span>
        </label>
        <select
          id="categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          required
          className="form-select"
        >
          <option value="">Selecciona una categoría</option>
          <option value="bajaProductos">Baja de Productos</option>
          <option value="citas">Citas</option>
          <option value="clientes">Clientes</option>
          <option value="compras">Compras</option>
          <option value="configuración">Configuración</option>
           <option value="descuentos">Descuentos</option>
          <option value="empleados">Empleados</option>
          <option value="insumos">Insumos</option>
          <option value="productos">Productos</option>
          <option value="proveedores">Proveedores</option>
          <option value="reportes">Reportes</option>
          <option value="roles">Roles</option>
          <option value="permisos">Permisos</option>
          <option value="servicios">Servicios</option>
          <option value="tipoDeServicios">Tipo de Servicios</option>
          <option value="usuarios">Usuarios</option>
          <option value="ventas">Ventas</option>
          <option value="vistasSidebar">Vistas Sidebar</option>
        </select>
      </div>
         


      <div className="form-group">
        <label htmlFor="nivel" className="form-label">
          Nivel <span className="text-pink-500">*</span>
        </label>
        <select id="nivel" name="nivel" value={formData.nivel} onChange={handleChange} required className="form-select">
          <option value="read">Lectura</option>
          <option value="write">Escritura</option>
          <option value="delete">Eliminación</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Lectura: solo ver, Escritura: crear/editar, Eliminación: eliminar registros
        </p>
      </div>

      <div className="form-group flex items-center">
        <input
          type="checkbox"
          id="activo"
          name="activo"
          checked={formData.activo}
          onChange={handleChange}
          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
        />
        <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
          Activo
        </label>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <button type="submit" disabled={cargando} className="btn-primary">
          {cargando ? (
            <div className="flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              <span>{editMode ? "Actualizando..." : "Creando..."}</span>
            </div>
          ) : (
            <span>{editMode ? "Actualizar Permiso" : "Crear Permiso"}</span>
          )}
        </button>
        <button type="button" onClick={onClose} disabled={cargando} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default FormularioPermiso


"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPercent, faTag, faSave, faTimes } from "@fortawesome/free-solid-svg-icons"
import "./formularioServ.css";

export default function FormularioTipoServicio({ tipoServicioSeleccionado, onTipoServicioActualizado, onClose }) {
  const [formData, setFormData] = useState({
    nombreTs: "",
    activo: true,
    descuento: 0,
    esPromocional: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tipoServicioSeleccionado) {
      setFormData({
        nombreTs: tipoServicioSeleccionado.nombreTs || "",
        activo: tipoServicioSeleccionado.activo !== undefined ? tipoServicioSeleccionado.activo : true,
        descuento: tipoServicioSeleccionado.descuento || 0,
        esPromocional: tipoServicioSeleccionado.esPromocional || false,
      })
    } else {
      setFormData({
        nombreTs: "",
        activo: true,
        descuento: 0,
        esPromocional: false,
      })
    }
  }, [tipoServicioSeleccionado])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  // Validación manual previa antes de hacer la petición
  const { nombreTs, descuento } = formData;

  // Validar nombreTs
  const nombreValido = (str) => {
    if (!str || typeof str !== "string") return false;
    if (str.trim().length < 3 || str.trim().length > 50) return false;
    if (/^\d+$/.test(str)) return false; // solo números
    if (!/^(?!.*([a-zA-ZáéíóúÁÉÍÓÚñÑ])\1{2,})([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)$/.test(str)) return false;

    // Evitar cadenas repetidas como "abcabcabc" o "aaaaaa"
    const isRepeated = (value) => {
      const len = value.length;
      for (let i = 1; i <= len / 2; i++) {
        const sub = value.slice(0, i);
        if (sub.repeat(len / i) === value) {
          return true;
        }
      }
      return false;
    };

    if (isRepeated(str)) return false;

    return true;
  };

  if (!nombreValido(nombreTs)) {
    setLoading(false);
    return Swal.fire({
      icon: "warning",
      title: "Nombre inválido",
      text: "El nombre no puede contener más de dos letras iguales consecutivas, solo letras y espacios, ni ser una cadena repetida o solo números. Debe tener entre 3 y 50 caracteres.",
      confirmButtonColor: "#f59e0b", // Amarillo
    });
  }

 // Validar descuento
const descuentoStr = String(descuento).trim();

// Explicación de la regex:
// ^            -> inicio de la cadena
// [1-9]        -> primer dígito debe ser del 1 al 9 (nunca 0)
// \d{1,2}      -> seguido de 1 o 2 dígitos más (total: 2 a 3 dígitos)
// $            -> fin de la cadena
const descuentoRegex = /^[0-9]\d{1,2}$/; //

const descuentoNum = Number(descuentoStr);

// Validación completa
if (
  !descuentoRegex.test(descuentoStr) || // no cumple con formato (ej: empieza en 0 o tiene menos de 2 dígitos)
  isNaN(descuentoNum) || 
  descuentoNum < 0 || 
  descuentoNum > 100
) {
  setLoading(false);
  return Swal.fire({
    icon: "warning",
    title: "Descuento inválido",
    text: "El descuento debe ser un número entre 0 y 100, sin comenzar en 0 y con mínimo 2 dígitos.",
    confirmButtonColor: "#f59e0b", // color amarillo
  });
}


  try {
    const token = localStorage.getItem("token");
    const url = tipoServicioSeleccionado
      ? `https://gitbf.onrender.com/api/tiposervicios/${tipoServicioSeleccionado._id}`
      : "https://gitbf.onrender.com/api/tiposervicios";
    const method = tipoServicioSeleccionado ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Error al guardar el tipo de servicio");
    }

    const data = await response.json();

    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: tipoServicioSeleccionado
        ? "Tipo de servicio actualizado correctamente"
        : "Tipo de servicio creado correctamente",
      confirmButtonColor: "#db2777",
    });

    onTipoServicioActualizado(data.tiposervicio);
  } catch (error) {
    console.error("Error:", error);
    setError(error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message,
      confirmButtonColor: "#db2777",
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        {tipoServicioSeleccionado ? "Editar Tipo de Servicio" : "Nuevo Tipo de Descuento"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombreTs" className="form-label">
            Nombre del Tipo de Descuento
          </label>
          <input
            type="text"
            id="nombreTs"
            name="nombreTs"
            minLength={3}
            maxLength={50}
            value={formData.nombreTs}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descuento" className="form-label flex items-center">
            <FontAwesomeIcon icon={faPercent} className="mr-2 text-pink-500" />
            Descuento (%)
          </label>
          <input
            type="number"
            id="descuento"
            name="descuento"
            value={formData.descuento}
            onChange={handleInputChange}
            className="form-input"
            minLength={1}
            maxLength={3}
            min="0"
            max="100"
            step="1"
          />
          <div className="text-sm text-gray-500 mt-1">
            Ingresa un valor entre 0 y 100. Este descuento se aplicará a todos los servicios de este tipo.
          </div>
        </div>

        <div className="form-group">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="esPromocional"
              name="esPromocional"
              checked={formData.esPromocional}
              onChange={handleInputChange}
              className="form-checkbox h-5 w-5 text-pink-600"
            />
            <label htmlFor="esPromocional" className="ml-2 form-label flex items-center">
              <FontAwesomeIcon icon={faTag} className="mr-2 text-pink-500" />
              Es tipo promocional
            </label>
          </div>
          <div className="text-sm text-gray-500 mt-1 ml-7">
            Marca esta opción si este tipo de servicio es para promociones temporales.
          </div>
        </div>

        <div className="form-group">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleInputChange}
              className="form-checkbox h-5 w-5 text-pink-600"
            />
            <label htmlFor="activo" className="ml-2 form-label">
              Activo
            </label>
          </div>
          <div className="text-sm text-gray-500 mt-1 ml-7">
            Desactiva esta opción para ocultar este tipo de servicio en el sistema.
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary flex items-center" disabled={loading}>
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex items-center" disabled={loading}>
            {loading ? (
              <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
            ) : (
              <FontAwesomeIcon icon={faSave} className="mr-2" />
            )}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}


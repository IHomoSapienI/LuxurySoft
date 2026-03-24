"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useSidebar } from "../Sidebar/Sidebar";
import { FaUpload, FaSpinner, FaPercent, FaTag } from "react-icons/fa";
import "./formularioServ.css";
import { calcularPrecioConDescuento } from "./obtenerServicios";

const FormularioServicio = ({
  servicioSeleccionado,
  onClose,
  onServicioActualizado,
}) => {
  const [formData, setFormData] = useState({
    nombreServicio: "",
    tipoServicio: "",
    tipoServicio2: "",
    tiempo: "",
    precio: "",
    descripcion: "",
    estado: true,
    imagen: null,
  });
  const [tiposServicios, setTiposServicios] = useState([]);
  const [tiposServicios2, setTiposServicios2] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const obtenerTiposServicios = async () => {
      setIsLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          axios.get("https://gitbf.onrender.com/api/tiposervicios"),
          axios.get("https://gitbf.onrender.com/api/tiposervicioss"),
        ]);

        setTiposServicios(res1.data.tiposervicios || []);
        setTiposServicios2(res2.data.tiposerviciosts || []);
      } catch (error) {
        console.error("Error al obtener los tipos de servicios:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los tipos de servicios",
          confirmButtonColor: "#db2777",
        });
      } finally {
        setIsLoading(false);
      }
    };

    obtenerTiposServicios();
  }, []);

  useEffect(() => {
    if (servicioSeleccionado) {
      setFormData({
        nombreServicio: servicioSeleccionado.nombreServicio || "",
        tipoServicio: servicioSeleccionado.tipoServicio
          ? servicioSeleccionado.tipoServicio._id
          : "",
        tipoServicio2: servicioSeleccionado.tipoServicio2
          ? servicioSeleccionado.tipoServicio2._id
          : "",
        tiempo: servicioSeleccionado.tiempo || "",
        precio: servicioSeleccionado.precio || "",
        descripcion: servicioSeleccionado.descripcion || "",
        estado: servicioSeleccionado.estado || true,
        imagen: null,
      });

      // Si hay una imagen existente, mostrarla en la vista previa
      if (servicioSeleccionado.imagenUrl) {
        setPreviewImage(
          `https://gitbf.onrender.com/uploads/${servicioSeleccionado.imagenUrl}`
        );
      }
    }
  }, [servicioSeleccionado]);

  const manejarCambio = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files[0]) {
      setPreviewImage(URL.createObjectURL(files[0]));
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      let newValue = type === "checkbox" ? checked : value;

      // Validación específica para el campo "tiempo"
      if (name === "tiempo") {
        // Permitir solo números
        if (!/^\d*$/.test(newValue)) return;

        // No permitir más de 3 dígitos ni valores mayores a 999
        if (newValue.length > 3 || parseInt(newValue, 10) > 999) return;
      }

      if (name === "precio") {
        // Bloquear notación científica
        if (/e/i.test(newValue)) return;

        // Permitir solo dígitos
        if (!/^\d*$/.test(newValue)) return;

        // Máximo 6 dígitos y entre 1 y 999999
        if (newValue.length > 6 || parseInt(newValue, 10) > 999999) return;
      }

      setFormData({
        ...formData,
        [name]: newValue,
      });
    }
  };

  const handleBlurNombreServicio = async (e) => {
    const nombre = e.target.value.trim();

    if (!nombre) return; // No validar si está vacío

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://gitbf.onrender.com/api/servicios/validar-nombre?nombre=${encodeURIComponent(
          nombre
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Si llega aquí, el nombre está disponible
      // console.log("Nombre disponible");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Swal.fire({
          icon: "warning",
          title: "Nombre duplicado",
          text: "El nombre del servicio ya está en uso.",
          confirmButtonColor: "#db2777",
        });
      } else {
        console.error("❌ Error al validar nombre:", error);
      }
    }
  };

  const manejarCambioTipoServicio = (e) => {
    const tipoServicioId = e.target.value;

    // Actualizar el estado del formulario
    setFormData({
      ...formData,
      tipoServicio: tipoServicioId,
    });

    // Si se seleccionó un tipo de servicio, verificar si tiene descuento
    if (tipoServicioId) {
      const tipoSeleccionado = tiposServicios.find(
        (tipo) => tipo._id === tipoServicioId
      );

      if (tipoSeleccionado && tipoSeleccionado.descuento > 0) {
        // Calcular el precio con descuento si hay un precio ingresado
        if (formData.precio) {
          const precioOriginal = Number.parseFloat(formData.precio);
          const descuento = tipoSeleccionado.descuento / 100;
          const precioConDescuento =
            precioOriginal - precioOriginal * descuento;

          // Mostrar mensaje de descuento
          Swal.fire({
            icon: "info",
            title: "Descuento Aplicado",
            html: `
              <div class="text-left">
                <p>Este tipo de servicio tiene un descuento del <b>${
                  tipoSeleccionado.descuento
                }%</b>.</p>
                <p class="mt-2">Precio original: <span style="text-decoration: line-through;">$${precioOriginal.toFixed(
                  2
                )}</span></p>
                <p style="color: #e11d48; font-weight: bold;">Precio con descuento: $${precioConDescuento.toFixed(
                  2
                )}</p>
                ${
                  tipoSeleccionado.esPromocional
                    ? '<p class="mt-2" style="color: #f59e0b;">Este es un tipo promocional.</p>'
                    : ""
                }
              </div>
            `,
            confirmButtonColor: "#db2777",
          });
        }
      }
    }
  };

  const manejarCambioTipoServicio2 = (e) => {
    const tipoServicio2Id = e.target.value;
    // Actualizar el estado del formulario
    setFormData({
      ...formData,
      tipoServicio2: tipoServicio2Id,
    });
  };

  const validarNombreServicio = (nombre) => {
    if (/(.)\1{2,}/.test(nombre)) {
      return "No se permiten más de dos letras consecutivas repetidas";
    }

    if (!/^[a-zA-Z\s&.,¡!¿?()]+$/.test(nombre)) {
      return "EL campo Nombre Solo permite letras y signos básicos";
    }

    if (/^\d+$/.test(nombre)) {
      return "El nombre del servicio no puede ser solo números";
    }

    const repeated = (str) => {
      const len = str.length;
      for (let i = 1; i <= len / 2; i++) {
        const sub = str.slice(0, i);
        if (sub.repeat(len / i) === str) {
          return true;
        }
      }
      return false;
    };

    if (repeated(nombre)) {
      return "El nombre del servicio no puede ser una cadena repetida";
    }

    return null; // válido
  };

  const validarDescripcion = (value) => {
    if (!value) return "La descripción es obligatoria.";
    if (value.length < 5 || value.length > 100)
      return "La descripción debe tener entre 5 y 100 caracteres.";
    // ✅ AÑADIR ESTA LÍNEA
    if (!/^[\p{L}\p{N}\s.,!?¡¿()&'"%-]+$/u.test(value)) {
      return "La descripción solo permite letras, números y signos básicos.";
    }
    if (/^\d+$/.test(value)) return "La descripción no puede ser solo números.";
    const repeated = (str) => {
      const len = str.length;
      for (let i = 1; i <= len / 2; i++) {
        const sub = str.slice(0, i);
        if (sub.repeat(len / i) === str) return true;
      }
      return false;
    };
    if (repeated(value))
      return "La descripción no puede ser una cadena repetida.";
    return null;
  };

  const validarTiempo = (tiempo) => {
    if (tiempo === "" || tiempo === null || tiempo === undefined)
      return "El tiempo es obligatorio.";

    const num = Number(tiempo);
    if (!Number.isInteger(num)) return "El tiempo debe ser un número entero.";
    if (num < 1 || num > 999)
      return "El tiempo debe estar entre 1 y 999 minutos.";
    return null;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    const error = validarNombreServicio(formData.nombreServicio);
    const errorDescripcion = validarDescripcion(formData.descripcion);
    const errorTiempo = validarTiempo(formData.tiempo);
    if (error || errorDescripcion || errorTiempo) {
      Swal.fire({
        icon: "warning",
        title: "Validación inválida",
        text: error || errorDescripcion || errorTiempo,
        confirmButtonColor: "#db2777",
      });
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();

    for (const key in formData) {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    }

    try {
      const token = localStorage.getItem("token");
      let response;
      if (servicioSeleccionado) {
        response = await axios.put(
          `https://gitbf.onrender.com/api/servicios/${servicioSeleccionado._id}`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          "https://gitbf.onrender.com/api/servicios",
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Servicio guardado correctamente.",
        confirmButtonColor: "#db2777",
      });
      onServicioActualizado(response.data.servicio);
      onClose();
    } catch (error) {
      console.error(
        "Error al guardar el servicio:",
        error.response ? error.response.data : error.message
      );
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el servicio. Inténtalo nuevamente.",
        confirmButtonColor: "#db2777",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para calcular el precio con descuento
  const calcularPrecioConDescuentoLocal = () => {
    if (!formData.tipoServicio || !formData.precio) return null;

    const tipoSeleccionado = tiposServicios.find(
      (t) => t._id === formData.tipoServicio
    );
    if (!tipoSeleccionado) return null;

    const precioOriginal = Number.parseFloat(formData.precio);
    return calcularPrecioConDescuento(precioOriginal, tipoSeleccionado);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Obtener el tipo de servicio seleccionado
  const tipoServicioSeleccionado = formData.tipoServicio
    ? tiposServicios.find((t) => t._id === formData.tipoServicio)
    : null;

  // Verificar si tiene descuento
  const tieneDescuento =
    tipoServicioSeleccionado && tipoServicioSeleccionado.descuento > 0;

  // Calcular precio con descuento
  const precioConDescuento = calcularPrecioConDescuentoLocal();

  return (
    <div className="formulario-moderno-serv bg-white p-6 rounded-lg shadow-lg w-full max-w-[100%] max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        {servicioSeleccionado ? "Editar Servicio" : "Agregar Servicio"}
      </h2>
      <form onSubmit={manejarSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombreServicio" className="form-label">
            Nombre Servicio <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="nombreServicio"
            name="nombreServicio"
            minLength={5}
            maxLength={50}
            pattern="^[a-zA-Z\s&.,¡!¿?()]+$"
            title="Solo se permiten letras y signos básicos. No se permiten números ni más de dos letras repetidas."
            value={formData.nombreServicio}
            onChange={manejarCambio}
            onBlur={handleBlurNombreServicio}
            required
            className="form-input"
            placeholder="Ingrese el nombre del servicio"
          />
        </div>

        <div className="form-group">
          <label
            htmlFor="tipoServicio"
            className="form-label flex items-center"
          >
            <span>Tipo de Descuento</span>{" "}
            <span className="text-pink-500 ml-1">*</span>
          </label>
          <select
            id="tipoServicio"
            name="tipoServicio"
            value={formData.tipoServicio}
            onChange={manejarCambioTipoServicio}
            required
            className="form-select"
          >
            <option value="">
              Seleccione la categoría a la que pertenece el descuento
            </option>
            {tiposServicios.map((tipo) => (
              <option key={tipo._id} value={tipo._id}>
                {tipo.nombreTs}
                {tipo.descuento > 0 ? ` (${tipo.descuento}% descuento)` : ""}
                {tipo.esPromocional ? " - Promocional" : ""}
              </option>
            ))}
          </select>


          <span>Tipo de Servicio</span>{" "}
            <span className="text-pink-500 ml-1">*</span>
          <select
          id="tipoServicio"
            name="tipoServicio2"
            value={formData.tipoServicio2}
            onChange={manejarCambioTipoServicio2}
            className="form-select"
          >
            <option value="">Selecciona otro tipo de servicio</option>
            {tiposServicios2.map((tipo) => (
              <option key={tipo._id} value={tipo._id}>
                {tipo.nombreTipoServicio}
              </option>
            ))}
          </select>

          {tieneDescuento && (
            <div className="mt-2 p-3 bg-pink-50 border border-pink-200 rounded-md text-sm">
              <div className="flex items-center mb-1">
                <FaPercent className="text-pink-500 mr-2" />
                <p className="text-pink-700 font-semibold">
                  Descuento aplicado: {tipoServicioSeleccionado.descuento}%
                </p>
              </div>

              {formData.precio && (
                <div className="flex items-center mt-2">
                  <span className="line-through text-gray-500 mr-2">
                    ${Number.parseFloat(formData.precio).toFixed(2)}
                  </span>
                  <span className="font-bold text-pink-600">
                    ${precioConDescuento.toFixed(2)}
                  </span>
                </div>
              )}

              {tipoServicioSeleccionado.esPromocional && (
                <div className="flex items-center mt-2 text-amber-600">
                  <FaTag className="mr-2" />
                  <span>Tipo promocional</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="tiempo" className="form-label">
              Duración (minutos) <span className="text-pink-500">*</span>
            </label>
            <input
              type="number"
              id="tiempo"
              name="tiempo"
              value={formData.tiempo}
              onChange={manejarCambio}
              className="form-input"
              min={1}
              max={999}
              step={1}
              required
              title="Ingrese un número entero entre 1 y 999"
            />

            <p className="text-xs text-gray-500 mt-1">
              Ingrese la duración del servicio en minutos.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="precio" className="form-label">
              Precio <span className="text-pink-500">*</span>
            </label>
            <input
              type="number"
              id="precio"
              name="precio"
              value={formData.precio}
              onChange={(e) => {
                const value = e.target.value;
                // Validar que no contenga notación científica (e/E)
                if (/e/i.test(value)) return;

                manejarCambio(e);
              }}
              required
              min="1"
              max="999999"
              step="1"
              className="form-input"
              title="Solo se permiten números enteros positivos"
            />

            <p className="text-xs text-gray-500 mt-1">
              Ingrese el precio del servicio.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion" className="form-label">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            minLength={5}
            maxLength={100}
            pattern=""
            title="Solo se permiten letras, números y signos básicos. No se permiten descripciones con solo números ni cadenas repetidas."
            value={formData.descripcion}
            onChange={manejarCambio}
            className="form-textarea"
            rows="1"
            placeholder="Ingrese la descripción del servicio"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="estado" className="form-label">
            Estado del Servicio
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={manejarCambio}
            className="form-select"
          >
            <option value={true}>Activo</option>
            <option value={false}>Inactivo</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="imagen" className="form-label">
            Imagen del Servicio{" "}
            {!servicioSeleccionado && <span className="text-pink-500">*</span>}
          </label>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-pink-300 border-dashed rounded-md hover:border-pink-500 transition-colors">
                <div className="space-y-1 text-center">
                  {!previewImage ? (
                    <>
                      <FaUpload className="mx-auto h-12 w-12 text-pink-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="imagen"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500"
                        >
                          <span>Subir un archivo</span>
                          <input
                            id="imagen"
                            name="imagen"
                            type="file"
                            className="sr-only"
                            onChange={manejarCambio}
                            required={!servicioSeleccionado}
                            accept="image/*"
                          />
                        </label>
                        <p className="pl-1">o arrastrar y soltar</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </>
                  ) : (
                    <div className="relative ">
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Vista previa"
                        className="max-h-40 mx-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setFormData({ ...formData, imagen: null });
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                      >
                        ×
                      </button>
                      <p className="mt-2 text-sm text-pink-600">
                        Haga clic para cambiar la imagen
                        <input
                          id="imagen"
                          name="imagen"
                          type="file"
                          className="sr-only"
                          onChange={manejarCambio}
                          accept="image/*"
                        />
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? (
              <div className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                <span>
                  {servicioSeleccionado ? "Actualizando..." : "Agregando..."}
                </span>
              </div>
            ) : servicioSeleccionado ? (
              "Actualizar Servicio"
            ) : (
              "Agregar Servicio"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioServicio;

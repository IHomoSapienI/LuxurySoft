"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./login.css";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginContainerRef = useRef(null);

  // Función para aplicar estilos forzados para subir el formulario
  const applyForcedStyles = () => {
    // Forzar estilos en el body y html
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("login-page-active");
    document.documentElement.classList.add("login-page-active");

    // Forzar estilos en el contenedor de la aplicación
    const appContainer =
      document.getElementById("root") || document.getElementById("app");
    if (appContainer) {
      appContainer.classList.add("login-app-container");
      appContainer.style.overflow = "hidden";
    }

    // Forzar estilos en el contenedor de login
    if (loginContainerRef.current) {
      loginContainerRef.current.style.height = "100vh";
      loginContainerRef.current.style.width = "100%";
      loginContainerRef.current.style.display = "flex";
      loginContainerRef.current.style.alignItems = "flex-start"; // Alinear al principio
      loginContainerRef.current.style.justifyContent = "center";
      loginContainerRef.current.style.paddingTop = "13vh"; // Añadir padding superior
      loginContainerRef.current.style.overflow = "hidden";
    }
  };

  // Aplicar estilos inmediatamente al montar y en intervalos regulares
  useEffect(() => {
    // Aplicar estilos inmediatamente
    applyForcedStyles();

    // Aplicar estilos después de un breve retraso para asegurar que se apliquen después de cualquier otro cambio
    const initialTimeout = setTimeout(applyForcedStyles, 100);

    // Aplicar estilos periódicamente para asegurar que se mantengan
    const intervalId = setInterval(applyForcedStyles, 500);

    // Prevenir scroll con event listeners
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Agregar event listeners para prevenir scroll
    window.addEventListener("scroll", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });

    // Limpiar al desmontar
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      document.body.classList.remove("login-page-active");
      document.documentElement.classList.remove("login-page-active");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      window.removeEventListener("scroll", preventScroll);
      document.removeEventListener("touchmove", preventScroll);

      const appContainer =
        document.getElementById("root") || document.getElementById("app");
      if (appContainer) {
        appContainer.classList.remove("login-app-container");
        appContainer.style.overflow = "";
      }
    };
  }, []);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const response = await axios.post(
//         "https://gitbf.onrender.com/api/auth/login",
//         { email, password }
//       );
//       const { token, role, user } = response.data;
//       const  permisos = user.permisos || []; // Asegúrate de que permisos sea un array

//       if (!token || !role || !user) {
//         throw new Error("Token, role, or user missing from response");
//       }

//       login({
//         token,
//         role,
//         _id: user.id || user._id, // asegúrate de usar el campo correcto del backend
//         nombre: user.name, // o user.nombre, si tu backend devuelve ese campo
//         correo: user.email, // o user.correo, si tu backend devuelve ese campo
//         permisos
//       });
// console.log("Permisos recibidos:", permisos);

//       // localStorage.setItem("token", token);
//       // localStorage.setItem("userRole", role.toLowerCase());
//       // localStorage.setItem("userId", user.id);

//       // Redirigir según el rol del usuario
//       if (role.toLowerCase() === "admin") {
//         navigate("/dashboard");
//       } else {
//         navigate("/");
//       }
//     } catch (error) {
//       console.error("Error de login:", error);

//       // Verificar si el error es por cuenta inactiva
//       if (error.response?.data?.cuentaInactiva) {
//         Swal.fire({
//           icon: "error",
//           title: "Cuenta inactiva",
//           text: "Tu cuenta ha sido desactivada. Por favor, contacta al administrador para reactivarla.",
//           confirmButtonText: "Entendido",
//         });
//       }
//       // Verificar si el error es por rol desactivado
//       else if (error.response?.data?.rolDesactivado) {
//         Swal.fire({
//           icon: "error",
//           title: "Acceso denegado",
//           text: "Tu rol ha sido desactivado. Contacta al administrador.",
//           confirmButtonText: "Entendido",
//         });
//       } else {
//         setError(
//           error.response?.data?.message ||
//             "Credenciales inválidas. Por favor, intente de nuevo."
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const response = await axios.post(
      "https://gitbf.onrender.com/api/auth/login",
      { email, password }
    );
//  console.log("Respuesta completa del backend:", response.data); // 👈 Verifica esto
    const { token, role, permisos,user } = response.data;
    // const permisos = user.permisos || [];

    if (!token || !role || !user) {
      throw new Error("Token, role, or user missing from response");
    }

    // Guardar todo en contexto
    login({
      token,
      role,
      _id: user.id || user._id,
      nombre: user.name || user.nombre,
      correo: user.email || user.correo,
      permisos: permisos || [], // Asegúrate de que permisos sea un array
    });

    // console.log("Permisos recibidos:", permisos);

   

    // Redirigir según el rol
    if (role.toLowerCase() !== "cliente") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  } catch (error) {
    console.error("Error de login:", error);

    if (error.response?.data?.cuentaInactiva) {
      Swal.fire({
        icon: "error",
        title: "Cuenta inactiva",
        text: "Tu cuenta ha sido desactivada. Por favor, contacta al administrador para reactivarla.",
        confirmButtonText: "Entendido",
      });
    } else if (error.response?.data?.rolDesactivado) {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Tu rol ha sido desactivado. Contacta al administrador.",
        confirmButtonText: "Entendido",
      });
    } else {
      setError(
        error.response?.data?.message ||
        "Credenciales inválidas. Por favor, intente de nuevo."
      );
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="login-container" ref={loginContainerRef}>
      <div className="login-background">
        <div className="background-pattern-login"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="login-card"
      >
        <div className="login-content">
          <div className="header-container-login"></div>

          <div className="form-container-login">
            <h2 className="welcome-text-login">¡Bienvenido de nuevo!</h2>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group-login">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input-login"
                  placeholder=" "
                  id="email"
                />
                <label htmlFor="email" className="input-label-login">
                  Correo electrónico
                </label>
              </div>

              <div className="input-group-login">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input-login"
                  placeholder=" "
                  id="password"
                />
                <label htmlFor="password" className="input-label-login">
                  Contraseña
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="loader">
                    <div className="loader-circle"></div>
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </motion.button>
            </form>

            <div className="additional-options-login">
              <Link to="/forgot-password" className="option-link-login">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/register" className="option-link-login">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>

        <div className="login-decoration">
          <div className="decoration-content-login">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="logo-container-login"
            >
              <img
                src="https://gitbf.onrender.com/uploads/LogoLogin.webp"
                alt="SPA Y BELLEZA"
                className="logo-image-login"
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="decoration-title-login"
            >
              Belleza y Elegancia
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="decoration-text-login"
            >
              Descubre un mundo de belleza y profesionalismo en tus manos
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

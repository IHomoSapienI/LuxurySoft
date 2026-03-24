import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../util/axiosConfig";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener datos del usuario
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token para fetchUserData:", token);
      if (!token) return;

      // Usar axiosInstance (ya incluye el token automáticamente)
      const response = await axiosInstance.get("/auth/user");

      // console.log("Datos usuario:", response.data);
      const { role, _id, nombre, correo, permisos } = response.data;

      setUser({
        token,
        role: role ? role.toLowerCase() : "",
        _id,
        nombre,
        correo,
        permisos: permisos || [],
      });

      // Guardar en localStorage
      localStorage.setItem("userRole", role.toLowerCase());
      localStorage.setItem("userId", _id);
      localStorage.setItem("userName", nombre);
      localStorage.setItem("userEmail", correo);
      localStorage.setItem("permisos", JSON.stringify(permisos || []));
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
    }
  };

  const refreshUser = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const permisos = localStorage.getItem("permisos");

    if (token && role && userId && userName && userEmail) {
      setUser({
        token,
          role: role ? role.toLowerCase() : "",
        _id: userId,
        nombre: userName,
        correo: userEmail,
        permisos: permisos ? JSON.parse(permisos) : [],
      });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const { token, role, _id, nombre, correo, permisos } = userData;

    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role.toLowerCase());
    localStorage.setItem("userId", _id);
    localStorage.setItem("userName", nombre);
    localStorage.setItem("userEmail", correo);
    localStorage.setItem("permisos", JSON.stringify(permisos || []));

    setUser({
      token,
        role: role ? role.toLowerCase() : "",
      _id,
      nombre,
      correo,
      permisos: permisos || [],
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    setUser((prevUser) => {
      const updatedUser = {
        ...prevUser,
        ...updatedUserData,
      };

      Object.entries(updatedUserData).forEach(([key, value]) => {
        if (key === "permisos") {
          localStorage.setItem("permisos", JSON.stringify(value));
        } else {
          localStorage.setItem(key, value);
        }
      });

      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        fetchUserData,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

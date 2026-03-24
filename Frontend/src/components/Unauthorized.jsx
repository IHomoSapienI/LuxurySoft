"use client"

import { useAuth } from "../context/AuthContext"

const Unauthorized = () => {
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Acceso No Autorizado</h1>

        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página.
          {user?.rol && (
            <span className="block mt-2 text-sm">
              Tu rol actual: <span className="font-semibold text-pink-600">{user.rol}</span>
            </span>
          )}
        </p>

        <div className="space-y-3">
          {/* <button
            onClick={() => window.history.back()}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            Volver Atrás
          </button> */}

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Ir al Inicio
          </button>

          {user?.rol === "cliente" && (
            <button
              onClick={() => (window.location.href = "/mi-cuenta")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Mi Cuenta
            </button>
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Si crees que esto es un error, contacta al administrador del sistema.</p>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized

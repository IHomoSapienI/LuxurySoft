import Spinner from "./Spinner"

// Componente de overlay para bloquear la interfaz durante la carga
const LoadingOverlay = ({ isLoading, message = "Cargando...", children }) => {
  if (!isLoading) return children

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col justify-center items-center z-50">
        <Spinner size="md" color="blue" />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

export default LoadingOverlay


// Componente reutilizable de spinner
const Spinner = ({ size = "md", color = "blue" }) => {
    // Mapeo de tamaños
    const sizeClasses = {
      sm: "h-6 w-6 border-2",
      md: "h-12 w-12 border-t-2 border-b-2",
      lg: "h-16 w-16 border-4",
    }
  
    // Mapeo de colores
    const colorClasses = {
      blue: "border-blue-500",
      green: "border-green-500",
      red: "border-red-500",
      yellow: "border-yellow-500",
      purple: "border-purple-500",
      indigo: "border-indigo-500",
    }
  
    return (
      <div className="flex justify-center items-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} role="status">
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    )
  }
  
  export default Spinner
  
  
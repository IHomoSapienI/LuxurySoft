"use client"
import * as React from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, ChevronDown, Heart, LogOut, Menu, Search, Settings, User, X } from "lucide-react"
import { cn } from "../../libs/util"

// Opciones de avatares predefinidos
const avatarOptions = [
  {
    id: "avatar1",
    url: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light",
    gender: "female",
  },
  {
    id: "avatar2",
    url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortRound&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Pink&graphicType=Bat&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    gender: "female",
  },
  {
    id: "avatar3",
    url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
    gender: "male",
  },
]

// Componente Navbar original SIN CAMBIOS
export function Navbar({ variant = "main", isCollapsed = false, logo, className, children, ...props }) {
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "navbar sticky top-0 z-50 flex h-16 w-full items-center border-b border-pink-100/10 bg-white/95 px-6 backdrop-blur-md transition-all duration-300 hidden md:flex",
        isScrolled && "shadow-md shadow-pink-600/10",
        variant === "dashboard" && !isCollapsed && "ml-[280px] w-[calc(100%-280px)]",
        variant === "dashboard" && isCollapsed && "ml-[70px] w-[calc(100%-70px)]",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        {logo}
        {children}
      </div>
    </header>
  )
}

// Modificar el componente MobileSidebar para:
// 1. Asegurar que el logo se cargue correctamente
// 2. Pasar una función para cerrar el sidebar a los componentes hijos

export function MobileSidebar({ logo, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  // Prevenir scroll cuando el sidebar está abierto
  React.useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isSidebarOpen])

  // Crear un contexto para pasar la función de cierre a los componentes hijos
  const sidebarContext = React.useMemo(
    () => ({
      closeSidebar: () => setIsSidebarOpen(false),
    }),
    [],
  )

  return (
    <>
      {/* Header móvil con botón hamburguesa */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-pink-100/10 bg-white/95 px-6 backdrop-blur-md md:hidden">
        {/* Asegurarse de que el logo se cargue correctamente */}
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-pink-600" />
          <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            NailsSoft
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="flex h-full flex-col">
              {/* Header del sidebar */}
              <div className="flex items-center justify-between border-b border-pink-100 p-6">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-pink-600" />
                  <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    NailsSoft
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido del sidebar */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Pasar el contexto a los hijos */}
                  {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                      return React.cloneElement(child, { closeSidebar: () => setIsSidebarOpen(false) })
                    }
                    return child
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Modificar el componente SidebarDropdownMenu para cerrar el sidebar al hacer clic en un enlace
export function SidebarDropdownMenu({ icon: Icon, label, items, closeSidebar }) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ml-4 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                onClick={() => {
                  // Cerrar el sidebar al hacer clic en un enlace
                  if (closeSidebar) closeSidebar()
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Modificar el componente SidebarAvatarMenu para cerrar el sidebar al hacer clic en un enlace
export function SidebarAvatarMenu({ userName = "", onLogout, closeSidebar }) {
  const [userAvatar, setUserAvatar] = React.useState("avatar1")

  React.useEffect(() => {
    const userId = localStorage.getItem("userId")
    const savedAvatar = localStorage.getItem(`userAvatar_${userId}`)
    if (savedAvatar) {
      setUserAvatar(savedAvatar)
    }
  }, [])

  const currentAvatarUrl = avatarOptions.find((a) => a.id === userAvatar)?.url || avatarOptions[0].url

  return (
    <div className="space-y-4 border-t border-pink-100 pt-6">
      {/* Perfil de usuario */}
      <div className="flex items-center gap-3 px-4">
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-pink-200">
          <img
            src={currentAvatarUrl || "/placeholder.svg"}
            alt="Avatar de usuario"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{userName || "Usuario"}</span>
          <span className="text-sm text-gray-500">{localStorage.getItem("userEmail") || "Bienvenido"}</span>
        </div>
      </div>

      {/* Opciones del usuario */}
      <div className="space-y-1">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          onClick={() => {
            if (closeSidebar) closeSidebar()
          }}
        >
          <User className="h-5 w-5" />
          <span>Mi Perfil</span>
        </Link>

        <Link
          to="/mi-cuenta"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          onClick={() => {
            if (closeSidebar) closeSidebar()
          }}
        >
          <Settings className="h-5 w-5" />
          <span>Configuración</span>
        </Link>

        <button
          onClick={() => {
            if (closeSidebar) closeSidebar()
            onLogout()
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}

export function NavbarLogo() {
  return (
    <Link to="/" className="navbar-brand flex items-center gap-3">
      <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6.5 }}>
        <Heart className="h-8 w-8 text-pink-600" />
      </motion.div>
      <motion.img
        whileHover={{ scale: 1.1 }}
        src="/logo1.png"
        alt="NailsSoft Logo"
        className="h-10 w-10 rounded-full object-cover transition-transform"
      />
      <motion.span
        className="brand-name text-lg font-bold"
        style={{
          background: "linear-gradient(135deg, #ff69b4, #da70d6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        NailsSoft
      </motion.span>
    </Link>
  )
}

export function NavbarDropdownMenu({ icon: Icon, label, items }) {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-gray-700 transition-colors hover:bg-pink-50 hover:text-pink-600">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute left-1/2 top-full z-50 mt-1 min-w-[220px] -translate-x-1/2 rounded-lg border border-pink-100 bg-white p-1 shadow-lg"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-pink-50 hover:text-pink-600"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Versión del dropdown para sidebar móvil

export function AvatarMenu({ userName = "", onLogout }) {
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [userAvatar, setUserAvatar] = React.useState("avatar1")

  React.useEffect(() => {
    const userId = localStorage.getItem("userId")
    const savedAvatar = localStorage.getItem(`userAvatar_${userId}`)
    if (savedAvatar) {
      setUserAvatar(savedAvatar)
    }
  }, [])

  const currentAvatarUrl = avatarOptions.find((a) => a.id === userAvatar)?.url || avatarOptions[0].url

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-full border-2 border-pink-200 bg-white p-2 hover:bg-pink-50"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden">
          <img
            src={currentAvatarUrl || "/placeholder.svg"}
            alt="Avatar de usuario"
            className="h-full w-full object-cover"
          />
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500 opacity-50" />
      </button>

      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-pink-100 bg-white p-1 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-2 flex items-center gap-3 border-b border-pink-100 p-2">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-pink-200">
                <img
                  src={currentAvatarUrl || "/placeholder.svg"}
                  alt="Avatar de usuario"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userName || "Usuario"}</span>
                <span className="truncate text-xs text-gray-500">{localStorage.getItem("userEmail") || "Bienvenido"}</span>
              </div>
            </div>

            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-pink-50"
              onClick={() => {
                setShowUserMenu(false)
                window.location.href = "/profile"
              }}
            >
              <User className="h-4 w-4" />
              <span>Mi Perfil</span>
            </button>

            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-pink-50"
              onClick={() => {
                setShowUserMenu(false)
                window.location.href = "/mi-cuenta"
              }}
            >
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </button>

            <div className="my-1 mx-3 h-px bg-pink-100" />

            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
              onClick={() => {
                setShowUserMenu(false)
                onLogout()
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Versión del avatar para sidebar móvil

export function NavbarSearch() {
  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type="search"
        placeholder="Buscar..."
        className="h-9 w-64 rounded-full bg-pink-50/50 pl-10 pr-4 text-sm outline-none ring-pink-200 transition-all focus:ring-2"
      />
    </div>
  )
}

export function NavbarNotifications() {
  const [notifications, setNotifications] = React.useState(3)
  return (
    <div className="relative">
      <button className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-200/20 transition-colors hover:bg-pink-50/50">
        <Bell className="h-4 w-4 text-gray-600" />
        {notifications > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-medium text-white">
            {notifications}
          </span>
        )}
      </button>
    </div>
  )
}

export function NavbarAuthButtons() {
  return (
    <div className="flex items-center gap-4">
      <Link
        to="/login"
        className="flex items-center gap-2 rounded-lg bg-pink-50 px-4 py-2 font-medium text-pink-600 transition-all hover:bg-pink-100"
      >
        <span>Iniciar Sesión</span>
      </Link>
      <Link
        to="/register"
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
      >
        <span>Registrarse</span>
      </Link>
    </div>
  )
}

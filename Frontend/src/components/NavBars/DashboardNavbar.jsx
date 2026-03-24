"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Heart, LogOut, Settings, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { useLayoutType } from "../../hooks/useLayoutType"
import { cn } from "../../libs/util"
import { useSidebar } from "../Sidebar/Sidebar"
import ThemeToggle from "../ThemeToggle"
import "./dashboardNavBar.css"

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
  {
    id: "avatar4",
    url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Prescription02&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=BrownDark&clotheType=BlazerSweater&eyeType=Default&eyebrowType=RaisedExcited&mouthType=Default&skinColor=Pale",
    gender: "male",
  },
  {
    id: "avatar5",
    url: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairCurly&accessoriesType=Blank&hairColor=Red&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=PastelRed&eyeType=Surprised&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Tanned",
    gender: "female",
  },
  {
    id: "avatar6",
    url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairTheCaesar&accessoriesType=Sunglasses&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=ShirtScoopNeck&clotheColor=Gray01&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
    gender: "male",
  },
]

const DashboardNavbar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { hasPermission } = usePermissions()
  const { shouldShowSidebar } = useLayoutType()
  const { isCollapsed } = useSidebar()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState("avatar1")
  const [sidebarState, setSidebarState] = useState(isCollapsed)

  const userRole = user?.role || "admin"

  // Efecto para escuchar cambios en el estado del sidebar
  useEffect(() => {
    setSidebarState(isCollapsed)
  }, [isCollapsed])

  // Efecto para escuchar eventos de scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)

    const storedName = user?.nombre || localStorage.getItem("userName") || ""
    setUserName(storedName)

    const userId = localStorage.getItem("userId")
    const savedAvatar = localStorage.getItem(`userAvatar_${userId}`)
    if (savedAvatar) {
      setUserAvatar(savedAvatar)
    }

    return () => window.removeEventListener("scroll", handleScroll)
  }, [user])

  // Efecto para escuchar eventos de cambio de estado del sidebar
  useEffect(() => {
    const handleSidebarStateChange = (event) => {
      if (event.detail && event.detail.isCollapsed !== undefined) {
        setSidebarState(event.detail.isCollapsed)
      }
    }

    window.addEventListener("sidebarStateChanged", handleSidebarStateChange)
    return () => window.removeEventListener("sidebarStateChanged", handleSidebarStateChange)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Solo mostrar este navbar si debe mostrar sidebar
  if (!shouldShowSidebar) {
    return null
  }

  // Obtener la URL del avatar actual
  const currentAvatarUrl = avatarOptions.find((a) => a.id === userAvatar)?.url || avatarOptions[0].url

  return (
    <header
      className={cn(
        "dashboard-navbar fixed z-30 flex h-16 items-center border-b border-pink-100/100 bg-white/95 backdrop-blur-md transition-all duration-300 dark:card-gradient-4 dark:border-pink-900/20",
        isScrolled && "shadow-md shadow-pink-600/10 dark:shadow-pink-600/5",
        sidebarState ? "sidebar-collapsed" : "sidebar-expanded",
      )}
    >
      <div className="flex w-full items-center justify-between px-6 text-black">
        {/* Logo y título */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -50, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6.5 }}
          >
            <Heart className="h-8 w-8 text-pink-600" />
          </motion.div>
          <h1 className="hidden text-lg font-medium text-gray-800 dark:text-gray-200 md:block">
            Desarrollamos tus Sueños
          </h1>
          <motion.div animate={{ rotate: [0, 50, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6.5 }}>
            <Heart className="h-8 w-8 text-black-600 dark:text-white" />
          </motion.div>
        </div>

        {/* Controles de usuario - SOLO TEMA Y AVATAR */}
        <div className="flex items-center gap-4">
          {/* Botón de cambio de tema */}
          <ThemeToggle />

          {/* Avatar y menú de usuario */}
          <div className="relative">
            <button className="flex items-center gap-2" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="avatar-container h-8 w-8 overflow-hidden rounded-full border-2 border-pink-200 dark:border-pink-800">
                <img
                  src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                  alt="Avatar de usuario"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {userName || "Usuario"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500 opacity-50 dark:text-gray-400" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-pink-100 bg-white p-1 shadow-lg dark:border-pink-900 dark:bg-gray-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-2 flex items-center gap-3 border-b border-pink-100 p-2 dark:border-pink-900">
                    <div className="avatar-container h-10 w-10 overflow-hidden rounded-full border-2 border-pink-200 dark:border-pink-800">
                      <img
                        src={currentAvatarUrl || "/placeholder.svg?height=40&width=40"}
                        alt="Avatar de usuario"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800 ">
                        {userName || "Usuario"}
                      </span>
                      <span className="text-xs text-pink-500">{userRole}</span>
                    </div>
                  </div>

                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-black  transition-colors hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    onClick={() => {
                      navigate("/profile")
                      setShowUserMenu(false)
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </button>

                  {/* Solo mostrar configuración si tiene permisos */}
                  {hasPermission("verUsuariosMenu") && (
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-black  transition-colors hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      onClick={() => {
                        navigate("/usuarios")
                        setShowUserMenu(false)
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configuración</span>
                    </button>
                  )}

                  <div className="my-1 h-px bg-pink-100 dark:bg-pink-900"></div>

                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardNavbar

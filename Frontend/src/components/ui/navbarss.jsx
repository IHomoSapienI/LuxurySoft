// "use client"

// import { useState, useEffect } from "react"
// import { Link } from "react-router-dom"
// import { motion, AnimatePresence } from "framer-motion"
// import { ChevronDown, LogOut, User, Settings } from "lucide-react"

// // Opciones de avatares predefinidos
// const avatarOptions = [
//   {
//     id: "avatar1",
//     url: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light",
//     gender: "female",
//   },
//   {
//     id: "avatar2",
//     url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortRound&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Pink&graphicType=Bat&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light",
//     gender: "female",
//   },
//   {
//     id: "avatar3",
//     url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
//     gender: "male",
//   },
//   {
//     id: "avatar4",
//     url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Prescription02&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=BrownDark&clotheType=BlazerSweater&eyeType=Default&eyebrowType=RaisedExcited&mouthType=Default&skinColor=Pale",
//     gender: "male",
//   },
//   {
//     id: "avatar5",
//     url: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairCurly&accessoriesType=Blank&hairColor=Red&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=PastelRed&eyeType=Surprised&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Tanned",
//     gender: "female",
//   },
//   {
//     id: "avatar6",
//     url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairTheCaesar&accessoriesType=Sunglasses&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=ShirtScoopNeck&clotheColor=Gray01&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
//     gender: "male",
//   },
// ]

// export const Navbar = ({ children, variant = "main" }) => {
//   const [isScrolled, setIsScrolled] = useState(false)

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 20)
//     }

//     window.addEventListener("scroll", handleScroll)
//     return () => window.removeEventListener("scroll", handleScroll)
//   }, [])

//   const navbarClasses = {
//     main: `sticky top-0 z-30 w-full bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 ${
//       isScrolled ? "shadow-md" : ""
//     }`,
//     dashboard: "bg-transparent",
//   }

//   return (
//     <nav className={navbarClasses[variant]}>
//       <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">{children}</div>
//     </nav>
//   )
// }

// export const NavbarLogo = () => {
//   return (
//     <Link to="/" className="flex items-center space-x-2">
//       <img src="/logo1Navbar.webp" alt="Logo" className="h-10 w-auto" />
//       <span className="text-xl font-bold text-pink-600 dark:text-pink-400">NailsSoft</span>
//     </Link>
//   )
// }

// export const NavbarDropdownMenu = ({ icon: Icon, label, items }) => {
//   const [isOpen, setIsOpen] = useState(false)

//   return (
//     <div className="relative">
//       <button
//         className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <Icon className="h-4 w-4" />
//         <span>{label}</span>
//         <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
//       </button>

//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             transition={{ duration: 0.2 }}
//           >
//             {items.map((item, index) => (
//               <Link
//                 key={index}
//                 to={item.path}
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
//                 onClick={() => setIsOpen(false)}
//               >
//                 {item.icon && <item.icon className="mr-2 h-4 w-4" />}
//                 {item.label}
//               </Link>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }

// export const NavbarLogoutButton = ({ onClick }) => {
//   const [showUserMenu, setShowUserMenu] = useState(false)
//   const [userName, setUserName] = useState("")
//   const [userAvatar, setUserAvatar] = useState("avatar1")

//   useEffect(() => {
//     // Obtener el nombre de usuario del localStorage
//     const storedName = localStorage.getItem("userName") || ""
//     setUserName(storedName)

//     // Obtener el avatar del usuario del localStorage
//     const userId = localStorage.getItem("userId")
//     const savedAvatar = localStorage.getItem(`userAvatar_${userId}`)
//     if (savedAvatar) {
//       setUserAvatar(savedAvatar)
//     }
//   }, [])

//   // Obtener la URL del avatar actual
//   const currentAvatarUrl = avatarOptions.find((a) => a.id === userAvatar)?.url || avatarOptions[0].url

//   return (
//     <div className="relative">
//       <button className="flex items-center gap-2" onClick={() => setShowUserMenu(!showUserMenu)}>
//         <div className="avatar-container h-8 w-8 overflow-hidden rounded-full border-2 border-pink-200 dark:border-pink-800">
//           <img
//             src={currentAvatarUrl || "/placeholder.svg"}
//             alt="Avatar de usuario"
//             className="h-full w-full object-cover"
//           />
//         </div>
//         <ChevronDown className="h-4 w-4 text-gray-500 opacity-50 dark:text-gray-400" />
//       </button>

//       <AnimatePresence>
//         {showUserMenu && (
//           <motion.div
//             className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-pink-100 bg-white p-1 shadow-lg dark:border-pink-900 dark:bg-gray-800"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 10 }}
//             transition={{ duration: 0.2 }}
//           >
//             <div className="mb-2 flex items-center gap-3 border-b border-pink-100 p-2 dark:border-pink-900">
//               <div className="avatar-container h-10 w-10 overflow-hidden rounded-full border-2 border-pink-200 dark:border-pink-800">
//                 <img
//                   src={currentAvatarUrl || "/placeholder.svg"}
//                   alt="Avatar de usuario"
//                   className="h-full w-full object-cover"
//                 />
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{userName || "Usuario"}</span>
//                 <span className="text-xs text-gray-500 dark:text-gray-400">
//                   {localStorage.getItem("userRole") || "Cliente"}
//                 </span>
//               </div>
//             </div>

//             <Link
//               to="/profile"
//               className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-pink-50 dark:text-gray-200 dark:hover:bg-pink-900/20"
//               onClick={() => setShowUserMenu(false)}
//             >
//               <User className="h-4 w-4" />
//               <span>Mi Perfil</span>
//             </Link>

//             <Link
//               to="/mi-cuenta"
//               className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-pink-50 dark:text-gray-200 dark:hover:bg-pink-900/20"
//               onClick={() => setShowUserMenu(false)}
//             >
//               <Settings className="h-4 w-4" />
//               <span>Mi Cuenta</span>
//             </Link>

//             <div className="my-1 h-px bg-pink-100 dark:bg-pink-900"></div>

//             <button
//               className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
//               onClick={() => {
//                 setShowUserMenu(false)
//                 onClick()
//               }}
//             >
//               <LogOut className="h-4 w-4" />
//               <span>Cerrar Sesión</span>
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }

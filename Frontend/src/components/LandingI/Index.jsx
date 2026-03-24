"use client"

import { useEffect, useState, useRef, memo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faUsers,
  faStar,
  faCalendar,
  faAward,
  faChevronLeft,
  faChevronRight,
  faHeart,
  faGem,
  faMagic,
  faHandSparkles,
  faPaintBrush,
  faQuoteLeft,
  faQuoteRight,
  faCheck,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons"
import { faInstagram, faFacebook, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons"
import "./index.css"

// Componente optimizado para las estadísticas
const StatItem = memo(({ icon, value, label, index }) => (
  <motion.div
    key={index}
    initial={{ y: 50, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
    className="flex flex-col items-center text-center p-6 rounded-lg bg-pink-50 hover:shadow-lg hover:bg-pink-100/50 transition-all"
  >
    <FontAwesomeIcon icon={icon} className="w-8 h-8 text-pink-600 mb-4" />
    <h3 className="text-3xl font-bold text-gray-800 mb-2">{value}</h3>
    <p className="text-gray-600">{label}</p>
  </motion.div>
))

// Componente optimizado para las burbujas decorativas
const BackgroundBubbles = memo(() => {
  // Reducimos el número de burbujas para mejorar el rendimiento
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        // Precalculamos valores aleatorios para evitar recálculos
        const size = Math.random() * 100 + 50
        const left = Math.random() * 100
        const top = Math.random() * 100
        const delay = Math.random() * 10

        return (
          <div
            key={i}
            className="bubble absolute rounded-full bg-white/10 backdrop-blur-sm"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
    </>
  )
})

// Componente optimizado para el slider de imágenes
const ImageSlider = memo(({ images, currentSlide, setCurrentSlide }) => {
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {images.map((img, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <div className="aspect-[6/3] relative">
                <img
                  src={img || "/placeholder.svg"}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        aria-label="Previous slide"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-6 h-6 text-pink-600" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        aria-label="Next slide"
      >
        <FontAwesomeIcon icon={faChevronRight} className="w-6 h-6 text-pink-600" />
      </button>
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentSlide === index ? "bg-pink-600" : "bg-pink-200"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
})

// Componente para servicios destacados
const ServiceCard = memo(({ icon, title, description, price, onClick }) => (
  <motion.div
    whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
  >
    <div className="p-6">
      <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4 mx-auto">
        <FontAwesomeIcon icon={icon} className="text-pink-600 text-2xl" />
      </div>
      <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-4">{description}</p>
      <div className="text-center font-bold text-pink-600 text-xl mb-4">${price}</div>
      <button
        onClick={onClick}
        className="w-full py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
      >
        Reservar Ahora
      </button>
    </div>
  </motion.div>
))

// Componente para testimonios
const TestimonialCard = memo(({ name, role, image, quote }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="bg-white p-6 rounded-xl shadow-md"
  >
    <div className="flex items-center mb-4">
      <img
        src={image || "/placeholder.svg"}
        alt={name}
        className="w-16 h-16 rounded-full object-cover mr-4"
        loading="lazy"
      />
      <div>
        <h4 className="font-bold text-lg">{name}</h4>
        <p className="text-gray-600 text-sm">{role}</p>
      </div>
    </div>
    <div className="relative">
      <FontAwesomeIcon icon={faQuoteLeft} className="text-pink-200 text-xl absolute -left-2 -top-2" />
      <p className="text-gray-700 italic px-4">{quote}</p>
      <FontAwesomeIcon icon={faQuoteRight} className="text-pink-200 text-xl absolute -right-2 -bottom-2" />
    </div>
  </motion.div>
))

// Componente para pasos de cómo funciona
const StepCard = memo(({ number, title, description, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="flex flex-col items-center text-center"
  >
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-full bg-pink-600 flex items-center justify-center text-white text-2xl font-bold">
        {number}
      </div>
      <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
        <FontAwesomeIcon icon={icon} className="text-white" />
      </div>
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
))

// Componente para preguntas frecuentes
const FAQItem = memo(({ question, answer, isOpen, toggleOpen }) => (
  <div className="border-b border-pink-100 last:border-b-0">
    <button className="w-full py-4 px-6 flex justify-between items-center focus:outline-none" onClick={toggleOpen}>
      <h3 className="font-semibold text-left">{question}</h3>
      <div className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>
        <FontAwesomeIcon icon={faChevronRight} className="text-pink-600" />
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-4 text-gray-600">{answer}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
))

// Componente para promociones especiales
const PromotionCard = memo(({ title, description, discount, endDate, image, onClick }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate) - new Date()
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [endDate])

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl overflow-hidden shadow-lg text-white"
    >
      <div className="relative">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" loading="lazy" />
        <div className="absolute top-4 right-4 bg-white text-pink-600 font-bold text-xl rounded-full w-16 h-16 flex items-center justify-center">
          {discount}%
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="mb-4 text-white/90">{description}</p>

        <div className="mb-4">
          <p className="text-sm mb-2">La oferta termina en:</p>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <span className="text-2xl font-bold">{timeLeft.days}</span>
              </div>
              <span className="text-xs">Días</span>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <span className="text-2xl font-bold">{timeLeft.hours}</span>
              </div>
              <span className="text-xs">Horas</span>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <span className="text-2xl font-bold">{timeLeft.minutes}</span>
              </div>
              <span className="text-xs">Min</span>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <span className="text-2xl font-bold">{timeLeft.seconds}</span>
              </div>
              <span className="text-xs">Seg</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClick}
          className="w-full py-3 bg-white text-pink-600 font-bold rounded-lg hover:bg-pink-50 transition-colors"
        >
          ¡Aprovechar Ahora!
        </button>
      </div>
    </motion.div>
  )
})
// Componente para membresías
const MembershipCard = memo(({ title, price, features, isPopular, onClick }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className={`rounded-xl overflow-hidden shadow-lg ${
      isPopular ? "border-2 border-pink-500 relative" : "border border-gray-200"
    }`}
  >
    {isPopular && (
      <div className="absolute top-0 right-0 bg-pink-500 text-white py-1 px-4 text-sm font-bold">Más Popular</div>
    )}
    <div className={`p-6 ${isPopular ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : "bg-white"}`}>
      <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
      <div className="text-center mb-4">
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-sm">/mes</span>
      </div>
    </div>
    <div className="p-6 bg-white">
      <ul className="mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center mb-2">
            <FontAwesomeIcon icon={faCheck} className="text-pink-500 mr-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`w-full py-2 rounded-lg transition-colors ${
          isPopular
            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        Seleccionar Plan
      </button>
    </div>
  </motion.div>
))


const Index = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [openFAQ, setOpenFAQ] = useState(null)
  const sliderIntervalRef = useRef(null)
  const testimonialIntervalRef = useRef(null)

  // Optimizamos las URLs de las imágenes para usar versiones más pequeñas o WebP si están disponibles
  const images = [
    "http://gitbf.onrender.com/uploads/ImgFdo14.jpg",
    "http://gitbf.onrender.com/uploads/ImgFdo15.jpg",
    "http://gitbf.onrender.com/uploads/imgFdo3.jpg",
    "http://gitbf.onrender.com/uploads/ImgFdo5.jpeg",
    "http://gitbf.onrender.com/uploads/ImgFdo6.jpg",
    "http://gitbf.onrender.com/uploads/ImgFdo7.jpg",
  ]

  const stats = [
    { icon: faUsers, value: "500+", label: "Clientes Satisfechos" },
    { icon: faStar, value: "4.9", label: "Calificación Promedio" },
    { icon: faCalendar, value: "1000+", label: "Citas Realizadas" },
    { icon: faAward, value: "5+", label: "Años de Experiencia" },
  ]

  const services = [
    {
      icon: faHandSparkles,
      title: "Manicura Básica",
      description: "Limado, cutículas y esmalte tradicional para un look natural y elegante.",
      price: "15.000",
    },
    {
      icon: faPaintBrush,
      title: "Nail Art Premium",
      description: "Diseños exclusivos y personalizados con los mejores materiales del mercado.",
      price: "35.000",
    },
    {
      icon: faGem,
      title: "Uñas Acrílicas",
      description: "Extensiones duraderas con acabado profesional y diseño a elección.",
      price: "45.000",
    },
    {
      icon: faMagic,
      title: "Pedicura Spa",
      description: "Tratamiento completo con exfoliación, masaje y esmalte semipermanente.",
      price: "30.000",
    },
  ]

  const testimonials = [
    {
      name: "Carolina Martínez",
      role: "Cliente Frecuente",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      quote:
        "Desde que descubrí NailsSoft, no vuelvo a otro lugar. El servicio es impecable y los diseños son únicos. ¡Totalmente recomendado!",
    },
    {
      name: "Valentina Gómez",
      role: "Influencer de Belleza",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      quote:
        "Como creadora de contenido, necesito que mis uñas siempre luzcan perfectas. NailsSoft entiende exactamente lo que necesito y supera mis expectativas cada vez.",
    },
    {
      name: "Daniela Torres",
      role: "Cliente VIP",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      quote:
        "La membresía premium vale cada peso. Atención personalizada, diseños exclusivos y la flexibilidad de agenda que necesito con mi trabajo.",
    },
  ]

  const howItWorks = [
    {
      number: 1,
      title: "Elige tu Servicio",
      description: "Explora nuestro catálogo de servicios y selecciona el que más te guste.",
      icon: faMagic,
    },
    {
      number: 2,
      title: "Reserva tu Cita",
      description: "Selecciona fecha, hora y profesional según tu preferencia.",
      icon: faCalendar,
    },
    {
      number: 3,
      title: "Recibe Confirmación",
      description: "Recibirás un recordatorio antes de tu cita.",
      icon: faCheck,
    },
    {
      number: 4,
      title: "Disfruta la Experiencia",
      description: "Relájate y déjate consentir por nuestros profesionales.",
      icon: faHeart,
    },
  ]

  const faqs = [
    {
      question: "¿Cuánto tiempo dura una manicura semipermanente?",
      answer:
        "Nuestras manicuras semipermanentes están diseñadas para durar entre 2 y 3 semanas, dependiendo del cuidado y actividades diarias. Para mantenerlas en perfecto estado, recomendamos usar guantes para tareas domésticas y aplicar aceite de cutículas regularmente.",
    },
    {
      question: "¿Puedo cambiar o cancelar mi cita?",
      answer:
        "Sí, puedes modificar o cancelar tu cita hasta 24 horas antes de la hora programada sin ningún cargo. Los cambios o cancelaciones con menos de 24 horas de anticipación pueden estar sujetos a un cargo del 50% del servicio reservado.",
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer:
        "Aceptamos efectivo, todas las tarjetas de crédito y débito principales, transferencias bancarias y pagos a través de nuestra aplicación. También ofrecemos la opción de pagar en cuotas para servicios premium y paquetes de tratamiento.",
    },
    {
      question: "¿Ofrecen servicios a domicilio?",
      answer:
        "Sí, contamos con servicio a domicilio para clientes dentro del área metropolitana. Este servicio tiene un costo adicional dependiendo de la distancia y está disponible para reservas con al menos 48 horas de anticipación.",
    },
    {
      question: "¿Cómo funciona el programa de fidelidad?",
      answer:
        "Por cada servicio que realizas con nosotros, acumulas puntos que puedes canjear por descuentos, servicios gratuitos o productos exclusivos. Además, nuestros miembros VIP reciben beneficios adicionales como prioridad en reservas y descuentos permanentes.",
    },
  ]

  const promotions = [
    {
      title: "Pack Amigas",
      description: "Ven con una amiga y ambas obtienen un 25% de descuento en cualquier servicio premium.",
      discount: 25,
      endDate: "2025-04-30T23:59:59",
      image:
        "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Martes de Spa",
      description: "Todos los martes, 30% de descuento en nuestros tratamientos de pedicura spa.",
      discount: 30,
      endDate: "2025-05-15T23:59:59",
      image:
        "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    },
  ]

  const memberships = [
    {
      title: "Básico",
      price: 29.9,
      features: [
        "1 manicura básica al mes",
        "10% de descuento en servicios adicionales",
        "Acceso a reservas prioritarias",
        "Cambio de color gratuito",
      ],
      isPopular: false,
    },
    {
      title: "Premium",
      price: 59.9,
      features: [
        "2 servicios premium al mes",
        "20% de descuento en servicios adicionales",
        "Acceso a diseños exclusivos",
        "Tratamiento de parafina gratuito",
        "Productos de cuidado mensual",
      ],
      isPopular: true,
    },
    {
      title: "VIP",
      price: 89.9,
      features: [
        "Servicios ilimitados de manicura",
        "30% de descuento en todos los servicios",
        "Atención personalizada",
        "Productos premium de regalo",
        "Servicio a domicilio (1 vez al mes)",
        "Acceso a eventos exclusivos",
      ],
      isPopular: false,
    },
  ]

  // Optimizamos el intervalo del slider para evitar fugas de memoria
  useEffect(() => {
    sliderIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length)
    }, 5000)

    testimonialIntervalRef.current = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 8000)

    return () => {
      if (sliderIntervalRef.current) clearInterval(sliderIntervalRef.current)
      if (testimonialIntervalRef.current) clearInterval(testimonialIntervalRef.current)
    }
  }, [images.length, testimonials.length])

  const handleAddAppointment = () => {
    navigate("/seleccionarservicios")
  }

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full overflow-hidden">
      {/* Hero Section con fondo optimizado */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden hero-gradient">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-sm" />
          <BackgroundBubbles />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl text-white font-bold mb-6"
          >
            NailsSoft
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/90 mb-8"
          >
            Donde el arte se encuentra con la belleza
          </motion.p>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-pink-600 py-3 px-8 rounded-full font-semibold hover:bg-pink-50 transition-all shadow-lg flex items-center gap-2 mx-auto"
            onClick={handleAddAppointment}
          >
            Agenda tu Cita
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </motion.button>
        </div>
      </section>

      {/* Stats Section - Optimizado con componentes memorizados */}
      <section className="w-full py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatItem key={index} icon={stat.icon} value={stat.value} label={stat.label} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: Servicios Destacados */}
      <section className="w-full py-20 bg-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">Nuestros Servicios</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra amplia gama de servicios diseñados para realzar tu belleza natural y brindarte una
              experiencia única.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.description}
                price={service.price}
                onClick={handleAddAppointment}
              />
            ))}
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: Cómo Funciona */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">¿Cómo Funciona?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Reservar tu cita nunca fue tan fácil. Sigue estos simples pasos y prepárate para lucir unas uñas
              espectaculares.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
              <StepCard
                key={index}
                number={step.number}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section - Optimizado con lazy loading */}
      <section className="w-full py-20 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">Nuestra Galería</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explora nuestra colección de diseños únicos y déjate inspirar por nuestro trabajo artístico.
            </p>
          </motion.div>

          <ImageSlider images={images} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
        </div>
      </section>

      {/* NUEVA SECCIÓN: Testimonios */}
      <section className="w-full py-20 bg-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">Lo Que Dicen Nuestros Clientes</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Descubre por qué nuestros clientes nos eligen y confían en nosotros para sus tratamientos de belleza.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="w-full flex-shrink-0 px-4">
                      <TestimonialCard {...testimonial} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      currentTestimonial === index ? "bg-pink-600" : "bg-pink-200"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: Promociones Especiales */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">Ofertas Especiales</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              No te pierdas nuestras promociones exclusivas por tiempo limitado. ¡Aprovecha ahora!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {promotions.map((promo, index) => (
              <PromotionCard key={index} {...promo} onClick={handleAddAppointment} />
            ))}
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: Membresías */}
      <section className="w-full py-20 bg-pink-50">
        <div className="container mx-auto px-4">
          {/* <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">Planes de Membresía</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Únete a nuestro exclusivo club de belleza y disfruta de beneficios especiales cada mes.
            </p>
          </motion.div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {memberships.map((membership, index) => (
              <MembershipCard key={index} {...membership} onClick={handleAddAppointment} />
            ))}
          </div> */}
        </div>
      </section>

      {/* NUEVA SECCIÓN: Preguntas Frecuentes */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-700">Preguntas Frecuentes</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Encuentra respuestas a las preguntas más comunes sobre nuestros servicios.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto bg-pink-50 rounded-xl overflow-hidden">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                toggleOpen={() => toggleFAQ(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action - Simplificado para mejor rendimiento */}
      <section className="w-full py-20 cta-gradient">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8">¿Lista para transformar tus uñas?</h2>
            <p className="text-xl mb-12 text-white/90">
              Únete a nuestra comunidad de clientes satisfechos y descubre por qué somos la mejor opción.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-pink-600 py-4 px-8 rounded-full font-bold text-lg shadow-lg hover:bg-pink-50 transition-all"
              onClick={handleAddAppointment}
            >
              Agenda tu Cita Ahora
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: Contacto y Redes Sociales
      <section className="w-full py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-pink-700">Contáctanos</h2>
              <p className="text-gray-600 mb-8">
                Estamos aquí para responder tus preguntas y ayudarte a reservar tu próxima cita.
              </p>

              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faPhone} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Llámanos</p>
                  <p className="font-semibold">+57 300 xxx xxxx</p>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faEnvelope} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Escríbenos</p>
                  <p className="font-semibold">contacto@nailssoft.com</p>
                </div>
              </div>

              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visítanos</p>
                  <p className="font-semibold">Calle Falsa 123 Medellin, Colombia</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 text-pink-700">Síguenos</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faInstagram} className="text-xl" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faFacebook} className="text-xl" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faTiktok} className="text-xl" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-pink-50 p-8 rounded-xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-pink-700">Suscríbete a Nuestro Newsletter</h3>
              <p className="text-gray-600 mb-6">
                Recibe las últimas tendencias, promociones exclusivas y consejos de belleza directamente en tu bandeja
                de entrada.
              </p>

              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  className="w-full p-3 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                Suscribirme
              </button>

              <p className="text-xs text-gray-500 mt-4">
                Al suscribirte, aceptas recibir correos electrónicos de marketing de NailsSoft. Puedes darte de baja en
                cualquier momento.
              </p>
            </motion.div>
          </div>
        </div>
      </section> */}
    </div>
  )
}

export default Index


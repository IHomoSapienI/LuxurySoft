
"use client"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { FaInstagram, FaFacebookF, FaTwitter, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHeart } from "react-icons/fa"
import { useSidebar } from "../Sidebar/Sidebar"
import { useLayoutType } from "../../hooks/useLayoutType"
import "./footer.css"

const Footer = () => {
  const { shouldShowSidebar, isClient } = useLayoutType()
  const { isCollapsed } = useSidebar()

  // Footer administrativo para usuarios con sidebar
  if (shouldShowSidebar) {
    return (
      <div className={`admin-footer dark:bg-primary ${isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
        <p>
          Desarrollado con <FaHeart className="inline-block text-pink-500 animate-pulse dark:text-white" /> por
          NailsSoft
        </p>
      </div>
    )
  }

  // Footer completo para clientes y usuarios sin permisos administrativos
  return (
    <footer className="main-footer">
      <div className="footer-background">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="footer-bubble"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="footer-content">
        <div className="footer-grid">
          {/* Logo y Descripción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="footer-section"
          >
            <img src="https://gitbf.onrender.com/uploads/Logo1_Fotter.webp" alt="NailsSoft Logo" className="footer-logo" />
            <h2 className="footer-brand">NailsSoft</h2>
            <p className="footer-description">
              Transformando la gestión de salones de belleza con tecnología innovadora y experiencias únicas.
            </p>
            <div className="social-links">
              <motion.a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="social-link"
              >
                <FaInstagram />
              </motion.a>
              <motion.a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="social-link"
              >
                <FaFacebookF />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="social-link"
              >
                <FaTwitter />
              </motion.a>
            </div>
          </motion.div>

          {/* Enlaces Rápidos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="footer-section"
          >
            <h3 className="footer-title">Enlaces Rápidos</h3>
            <ul className="footer-links">
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/servicios">Nuestros Servicios</Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/citas">Reservar Cita</Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/productos">Productos</Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/blog">Blog de Belleza</Link>
              </motion.li>
            </ul>
          </motion.div>

          {/* Servicios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="footer-section"
          >
            <h3 className="footer-title">Nuestros Servicios</h3>
            <ul className="footer-links">
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/manicure">Manicure</Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/pedicure">Pedicure</Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/tratamientos">Tratamientos</Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link to="/especiales">Servicios Especiales</Link>
              </motion.li>
            </ul>
          </motion.div>

          {/* Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="footer-section"
          >
            <h3 className="footer-title">Contacto</h3>
            <ul className="contact-info">
              <motion.li whileHover={{ scale: 1.02 }}>
                <FaPhone className="contact-icon" />
                <span>(123) 456-7890</span>
              </motion.li>
              <motion.li whileHover={{ scale: 1.02 }}>
                <FaEnvelope className="contact-icon" />
                <span>contacto@nailssoft.com</span>
              </motion.li>
              <motion.li whileHover={{ scale: 1.02 }}>
                <FaMapMarkerAlt className="contact-icon" />
                <span>Calle 123, Medellín, Colombia</span>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="footer-bottom"
        >
          <div className="copyright">
            <p>© {new Date().getFullYear()} NailsSoft. Todos los derechos reservados.</p>
          </div>
          <div className="footer-legal">
            <Link to="/privacidad">Política de Privacidad</Link>
            <Link to="/terminos">Términos de Servicio</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer


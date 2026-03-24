import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCalendarAlt,
  faCreditCard,
  faClock,
  faShieldAlt,
  faHandSparkles,
  faUserLock,
  faChevronDown,
  faChevronUp,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons"
import { useNavigate } from "react-router-dom"
import "./politicas.css"

const Politicas = () => {
  const navigate = useNavigate()

  // Estado para controlar qué secciones están expandidas
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    cancelacion: true,
    pago: false,
    retraso: false,
    higiene: false,
    garantia: false,
    privacidad: false,
  })

  // Función para alternar la expansión de una sección
  const toggleSeccion = (seccion) => {
    setSeccionesExpandidas({
      ...seccionesExpandidas,
      [seccion]: !seccionesExpandidas[seccion],
    })
  }

  return (
    <div className="politicas-page">
      <div className="politicas-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>

        <div className="politicas-header">
          <h1>Políticas de Nuestro Salón</h1>
          <p>
            Para garantizar una experiencia excepcional, te invitamos a conocer nuestras políticas. Estas normas nos
            ayudan a brindarte el mejor servicio posible.
          </p>
        </div>

        <div className="politicas-content">
          {/* Política de Cancelación */}
          <div className="politica-seccion">
            <button
              className="politica-titulo"
              onClick={() => toggleSeccion("cancelacion")}
              aria-expanded={seccionesExpandidas.cancelacion}
            >
              <div className="politica-icono">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
              <h2>Cancelación y Reprogramación</h2>
              <FontAwesomeIcon
                icon={seccionesExpandidas.cancelacion ? faChevronUp : faChevronDown}
                className="politica-flecha"
              />
            </button>

            {seccionesExpandidas.cancelacion && (
              <div className="politica-contenido">
                <p>
                  Valoramos tu tiempo y el de nuestros profesionales. Para mantener un servicio eficiente, hemos
                  establecido las siguientes políticas de cancelación:
                </p>

                <ul>
                  <li>
                    <strong>Cancelación con 24 horas o más de anticipación:</strong> Puedes cancelar sin ningún cargo.
                  </li>
                  <li>
                    <strong>Cancelación con menos de 24 horas:</strong> Se aplicará un cargo del 30% del valor del
                    servicio reservado.
                  </li>
                  <li>
                    <strong>No presentarse a la cita sin aviso:</strong> Se cobrará el 50% del valor del servicio
                    reservado.
                  </li>
                  <li>
                    <strong>Reprogramación:</strong> Puedes reprogramar tu cita sin costo hasta 12 horas antes de la
                    hora programada. Las reprogramaciones con menos tiempo de anticipación pueden estar sujetas a un
                    cargo del 15%.
                  </li>
                  <li>
                    <strong>Clientes frecuentes:</strong> Si eres cliente frecuente (más de 3 visitas en los últimos 2
                    meses), tienes una cancelación sin cargo por mes, incluso con menos de 24 horas de anticipación.
                  </li>
                </ul>

                <p>
                  Para cancelar o reprogramar, puedes hacerlo a través de nuestra aplicación, llamando al salón, o
                  enviando un mensaje de WhatsApp al número de contacto.
                </p>
              </div>
            )}
          </div>

          {/* Política de Pago */}
          <div className="politica-seccion">
            <button
              className="politica-titulo"
              onClick={() => toggleSeccion("pago")}
              aria-expanded={seccionesExpandidas.pago}
            >
              <div className="politica-icono">
                <FontAwesomeIcon icon={faCreditCard} />
              </div>
              <h2>Pago y Reembolso</h2>
              <FontAwesomeIcon
                icon={seccionesExpandidas.pago ? faChevronUp : faChevronDown}
                className="politica-flecha"
              />
            </button>

            {seccionesExpandidas.pago && (
              <div className="politica-contenido">
                <p>
                  Ofrecemos diversas opciones de pago para tu comodidad y contamos con políticas claras sobre
                  reembolsos.
                </p>

                <h3>Métodos de Pago Aceptados:</h3>
                <ul>
                  <li>Efectivo</li>
                  <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express)</li>
                  <li>Transferencias bancarias</li>
                  <li>Pagos móviles (según disponibilidad)</li>
                </ul>

                <h3>Política de Reembolso:</h3>
                <ul>
                  <li>
                    <strong>Servicios realizados:</strong> No ofrecemos reembolsos por servicios ya completados. Si no
                    estás satisfecha con el resultado, por favor comunícalo inmediatamente para que podamos ofrecerte
                    una solución sin costo adicional.
                  </li>
                  <li>
                    <strong>Productos:</strong> Los productos sellados pueden ser devueltos dentro de los 7 días
                    posteriores a la compra con el recibo original. Se emitirá un reembolso completo o cambio por otro
                    producto.
                  </li>
                  <li>
                    <strong>Servicios no realizados:</strong> Si has pagado por adelantado y no pudiste recibir el
                    servicio por causas atribuibles al salón, recibirás un reembolso completo o podrás reprogramar sin
                    costo adicional.
                  </li>
                  <li>
                    <strong>Tarjetas de regalo y bonos:</strong> No son reembolsables pero tienen validez de un año
                    desde la fecha de compra.
                  </li>
                </ul>

                <p>
                  Para servicios especiales (eventos, novias, etc.) se requiere un depósito del 30% al momento de la
                  reserva, que se descontará del precio final del servicio.
                </p>
              </div>
            )}
          </div>

          {/* Política de Llegada Tardía */}
          <div className="politica-seccion">
            <button
              className="politica-titulo"
              onClick={() => toggleSeccion("retraso")}
              aria-expanded={seccionesExpandidas.retraso}
            >
              <div className="politica-icono">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <h2>Llegada Tardía</h2>
              <FontAwesomeIcon
                icon={seccionesExpandidas.retraso ? faChevronUp : faChevronDown}
                className="politica-flecha"
              />
            </button>

            {seccionesExpandidas.retraso && (
              <div className="politica-contenido">
                <p>
                  Para ofrecerte a ti y a todos nuestros clientes un servicio puntual y de calidad, hemos establecido
                  las siguientes políticas de llegada tardía:
                </p>

                <ul>
                  <li>
                    <strong>Llegada puntual:</strong> Te recomendamos llegar 5-10 minutos antes de tu cita para
                    registrarte y prepararte cómodamente.
                  </li>
                  <li>
                    <strong>Retraso de hasta 10 minutos:</strong> Tu servicio se realizará en el tiempo restante sin
                    afectar la calidad.
                  </li>
                  <li>
                    <strong>Retraso de 11-15 minutos:</strong> Haremos lo posible por atenderte, pero podría ser
                    necesario ajustar o reducir el alcance del servicio para respetar los horarios de los siguientes
                    clientes.
                  </li>
                  <li>
                    <strong>Retraso de más de 15 minutos:</strong> Lamentablemente, es posible que debamos reprogramar
                    tu cita y aplicar la política de cancelación, ya que no podríamos garantizar la calidad del servicio
                    en un tiempo reducido.
                  </li>
                  <li>
                    <strong>Casos especiales:</strong> Si sabes que llegarás tarde, llámanos con anticipación. Haremos
                    todo lo posible por acomodarte según la disponibilidad del día.
                  </li>
                </ul>

                <p>
                  Estas políticas nos permiten mantener un flujo eficiente de trabajo y garantizar que todos nuestros
                  clientes reciban la atención y el tiempo que merecen.
                </p>
              </div>
            )}
          </div>

          {/* Política de Higiene y Seguridad */}
          <div className="politica-seccion">
            <button
              className="politica-titulo"
              onClick={() => toggleSeccion("higiene")}
              aria-expanded={seccionesExpandidas.higiene}
            >
              <div className="politica-icono">
                <FontAwesomeIcon icon={faHandSparkles} />
              </div>
              <h2>Higiene y Seguridad</h2>
              <FontAwesomeIcon
                icon={seccionesExpandidas.higiene ? faChevronUp : faChevronDown}
                className="politica-flecha"
              />
            </button>

            {seccionesExpandidas.higiene && (
              <div className="politica-contenido">
                <p>
                  Tu salud y seguridad son nuestra máxima prioridad. Implementamos rigurosos protocolos de higiene y
                  desinfección que cumplen con todas las normativas sanitarias.
                </p>

                <h3>Nuestros Estándares de Higiene:</h3>
                <ul>
                  <li>
                    <strong>Esterilización profesional:</strong> Todos nuestros instrumentos metálicos son esterilizados
                    en autoclave después de cada uso.
                  </li>
                  <li>
                    <strong>Materiales desechables:</strong> Utilizamos limas, buffers, palitos de naranjo y otros
                    implementos desechables que son descartados después de cada cliente.
                  </li>
                  <li>
                    <strong>Desinfección de superficies:</strong> Todas las superficies de trabajo, sillas y equipos son
                    desinfectados entre cada cliente con productos de grado hospitalario.
                  </li>
                  <li>
                    <strong>Higiene del personal:</strong> Nuestros técnicos se lavan las manos antes de cada servicio,
                    utilizan guantes cuando es necesario y cumplen con estrictos protocolos de higiene personal.
                  </li>
                  <li>
                    <strong>Calidad del aire:</strong> Contamos con sistemas de ventilación y extractores para mantener
                    la calidad del aire en nuestras instalaciones.
                  </li>
                </ul>

                <h3>Tu Colaboración es Importante:</h3>
                <ul>
                  <li>
                    <strong>Condiciones preexistentes:</strong> Infórmanos si tienes alguna condición en las uñas
                    (hongos, infecciones, etc.) antes de tu cita.
                  </li>
                  <li>
                    <strong>Enfermedades contagiosas:</strong> Si presentas síntomas de enfermedad contagiosa, te
                    pedimos reprogramar tu cita sin penalización.
                  </li>
                  <li>
                    <strong>Heridas abiertas:</strong> Por tu seguridad, no podemos realizar servicios en áreas con
                    cortes o heridas abiertas.
                  </li>
                </ul>

                <p>
                  Nos enorgullece mantener los más altos estándares de limpieza e higiene para proteger tu salud y la de
                  nuestro equipo.
                </p>
              </div>
            )}
          </div>

          {/* Política de Garantía */}
          <div className="politica-seccion">
            <button
              className="politica-titulo"
              onClick={() => toggleSeccion("garantia")}
              aria-expanded={seccionesExpandidas.garantia}
            >
              <div className="politica-icono">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <h2>Garantía del Servicio</h2>
              <FontAwesomeIcon
                icon={seccionesExpandidas.garantia ? faChevronUp : faChevronDown}
                className="politica-flecha"
              />
            </button>

            {seccionesExpandidas.garantia && (
              <div className="politica-contenido">
                <p>
                  Estamos comprometidos con la excelencia y respaldamos la calidad de nuestro trabajo. Ofrecemos las
                  siguientes garantías para tu tranquilidad:
                </p>

                <h3>Garantías por Tipo de Servicio:</h3>
                <ul>
                  <li>
                    <strong>Esmaltado semipermanente:</strong> Garantizamos que durará al menos 7 días sin levantarse o
                    astillarse con el uso normal. Si ocurre antes, lo repararemos sin costo.
                  </li>
                  <li>
                    <strong>Uñas acrílicas/gel:</strong> Garantizamos nuestro trabajo por 10 días. Si una uña se rompe o
                    se levanta debido a defectos en la aplicación, la repararemos gratuitamente.
                  </li>
                  <li>
                    <strong>Extensiones:</strong> Garantizamos la adherencia por 7 días. Si se desprenden sin causa
                    externa, las recolocaremos sin cargo adicional.
                  </li>
                  <li>
                    <strong>Tratamientos especiales:</strong> Si un tratamiento no muestra los resultados prometidos,
                    ofreceremos una sesión adicional sin costo o un reembolso parcial.
                  </li>
                </ul>

                <h3>Condiciones de la Garantía:</h3>
                <ul>
                  <li>
                    <strong>Plazo:</strong> Debes notificarnos dentro de los días especificados para cada servicio.
                  </li>
                  <li>
                    <strong>Comprobante:</strong> Es necesario presentar el recibo o comprobante del servicio.
                  </li>
                  <li>
                    <strong>Exclusiones:</strong> La garantía no cubre daños causados por:
                    <ul>
                      <li>Accidentes o uso indebido</li>
                      <li>No seguir las recomendaciones de cuidado</li>
                      <li>Reparaciones realizadas por terceros</li>
                      <li>Actividades que sometan las uñas a condiciones extremas</li>
                    </ul>
                  </li>
                </ul>

                <p>
                  Para hacer válida la garantía, simplemente comunícate con nosotros y agenda una cita de revisión lo
                  antes posible.
                </p>
              </div>
            )}
          </div>

          {/* Política de Privacidad */}
          <div className="politica-seccion">
            <button
              className="politica-titulo"
              onClick={() => toggleSeccion("privacidad")}
              aria-expanded={seccionesExpandidas.privacidad}
            >
              <div className="politica-icono">
                <FontAwesomeIcon icon={faUserLock} />
              </div>
              <h2>Privacidad</h2>
              <FontAwesomeIcon
                icon={seccionesExpandidas.privacidad ? faChevronUp : faChevronDown}
                className="politica-flecha"
              />
            </button>

            {seccionesExpandidas.privacidad && (
              <div className="politica-contenido">
                <p>
                  Respetamos y protegemos tu privacidad. Esta política describe cómo recopilamos, utilizamos y
                  protegemos tu información personal.
                </p>

                <h3>Información que Recopilamos:</h3>
                <ul>
                  <li>
                    <strong>Datos personales básicos:</strong> Nombre, teléfono, correo electrónico y dirección.
                  </li>
                  <li>
                    <strong>Historial de servicios:</strong> Registramos los servicios que has recibido, preferencias y
                    posibles alergias o condiciones especiales.
                  </li>
                  <li>
                    <strong>Información de pago:</strong> Datos necesarios para procesar tus pagos.
                  </li>
                  <li>
                    <strong>Fotografías:</strong> Con tu consentimiento, podemos tomar fotos de tus uñas antes y después
                    del servicio para nuestro registro y/o uso promocional.
                  </li>
                </ul>

                <h3>Uso de tu Información:</h3>
                <ul>
                  <li>
                    <strong>Prestación del servicio:</strong> Para brindarte el mejor servicio personalizado.
                  </li>
                  <li>
                    <strong>Comunicación:</strong> Para enviarte recordatorios de citas, promociones especiales o
                    información relevante sobre nuestros servicios.
                  </li>
                  <li>
                    <strong>Mejora continua:</strong> Para analizar y mejorar nuestros servicios y atención al cliente.
                  </li>
                </ul>

                <h3>Protección de tus Datos:</h3>
                <ul>
                  <li>
                    <strong>Seguridad:</strong> Implementamos medidas técnicas y organizativas para proteger tu
                    información.
                  </li>
                  <li>
                    <strong>No compartimos tus datos:</strong> No vendemos ni compartimos tu información con terceros
                    sin tu consentimiento, excepto cuando sea requerido por ley.
                  </li>
                  <li>
                    <strong>Retención:</strong> Mantenemos tus datos solo por el tiempo necesario para los fines
                    descritos o según lo requiera la ley.
                  </li>
                </ul>

                <h3>Tus Derechos:</h3>
                <ul>
                  <li>Acceder a tu información personal</li>
                  <li>Corregir datos inexactos</li>
                  <li>Solicitar la eliminación de tus datos</li>
                  <li>Oponerte al procesamiento de tu información</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>

                <p>
                  Para ejercer estos derechos o si tienes preguntas sobre nuestra política de privacidad, por favor
                  contáctanos directamente.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="politicas-footer">
          <p>Estas políticas están sujetas a cambios. La última actualización fue realizada el 26 de marzo de 2024.</p>
          <p>Si tienes alguna pregunta sobre nuestras políticas, no dudes en contactarnos.</p>
        </div>
      </div>
    </div>
  )
}

export default Politicas
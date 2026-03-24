/**
 * Combina nombres de clase condicionales
 * @param  {...string} classes - Clases CSS a combinar
 * @returns {string} - Clases combinadas
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(" ")
  }
  


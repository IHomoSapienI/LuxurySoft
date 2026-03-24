"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaChevronDown } from "react-icons/fa"

const MenuGroup = ({ title, children, defaultExpanded = false, collapsed }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (collapsed) {
    return (
      <div className="menu-group collapsed">
        <div className="menu-group-header-collapsed">
          <h5>{title}</h5>
        </div>
        <div className="menu-group-content-collapsed">
          {React.Children.map(children, (child) => React.cloneElement(child, { collapsed }))}
        </div>
      </div>
    )
  }

  return (
    <div className="menu-group">
      <button className="menu-group-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h5>{title}</h5>
        <FaChevronDown className={`menu-group-icon ${isExpanded ? "expanded" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="menu-group-content"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MenuGroup

"use client"

import React, { useState, useRef, useEffect } from "react"

export const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {React.Children.map(children, (child) => {
        if (child && child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            "aria-expanded": isOpen,
          })
        }
        if (child && child.type === DropdownMenuContent) {
          return isOpen ? React.cloneElement(child, { onClose: () => setIsOpen(false) }) : null
        }
        return child
      })}
    </div>
  )
}

export const DropdownMenuTrigger = ({ children, asChild, ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props)
  }
  return (
    <button type="button" {...props}>
      {children}
    </button>
  )
}

export const DropdownMenuContent = ({ children, align = "end", className, onClose, ...props }) => {
  return (
    <div
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${
        align === "end" ? "right-0" : "left-0"
      } ${className || ""}`}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onClick: (e) => {
              child.props.onClick?.(e)
              onClose?.()
            },
          })
        }
        return child
      })}
    </div>
  )
}

export const DropdownMenuItem = ({ className, children, ...props }) => {
  return (
    <button
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

export const DropdownMenuLabel = ({ className, ...props }) => {
  return <div className={`px-2 py-1.5 text-sm font-semibold ${className || ""}`} {...props} />
}

export const DropdownMenuSeparator = ({ className, ...props }) => {
  return <div className={`-mx-1 my-1 h-px bg-muted ${className || ""}`} {...props} />
}


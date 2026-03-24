import React from "react"

export const Tabs = ({ className, defaultValue, value, onValueChange, children, ...props }) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue)

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setActiveTab(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <div className={`w-full ${className || ""}`} {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child

        if (child.type === TabsList || child.type === TabsContent) {
          return React.cloneElement(child, {
            activeTab,
            onValueChange: handleValueChange,
          })
        }

        return child
      })}
    </div>
  )
}

export const TabsList = ({ className, activeTab, onValueChange, children, ...props }) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${
        className || ""
      }`}
      role="tablist"
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child) || child.type !== TabsTrigger) return child

        return React.cloneElement(child, {
          active: activeTab === child.props.value,
          onClick: () => onValueChange(child.props.value),
        })
      })}
    </div>
  )
}

export const TabsTrigger = ({ className, value, active, children, ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${className || ""}`}
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ className, value, activeTab, children, ...props }) => {
  if (activeTab !== value) return null

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        className || ""
      }`}
      role="tabpanel"
      data-state={activeTab === value ? "active" : "inactive"}
      {...props}
    >
      {children}
    </div>
  )
}
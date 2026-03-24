export const Badge = ({ className, variant = "default", children, ...props }) => {
  const baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-success/10 text-success hover:bg-success/20",
    warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  }

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className || ""}`} {...props}>
      {children}
    </span>
  )
}


import type { ButtonHTMLAttributes } from 'react'

export default function VisualButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`visual-button ${className}`} {...props} />
}
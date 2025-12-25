import React from 'react'
import './Input.css'

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  label,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-container ${className}`}>
      {label && (
        <label className="input-label" htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? 'input-error' : ''}`}
        required={required}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export default Input


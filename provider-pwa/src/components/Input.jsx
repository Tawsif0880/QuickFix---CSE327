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
  options = null,
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
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`input-field ${error ? 'input-error' : ''}`}
          required={required}
          {...props}
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options && options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
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
      )}
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export default Input


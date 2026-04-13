import { Input } from '@/components/ui/input'
import { ChangeEvent, forwardRef, InputHTMLAttributes, useState } from 'react'

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, defaultValue, ...props }, ref) => {
    const initialDigits = String(defaultValue || '').replace(/\D/g, '')
    const [rawValue, setRawValue] = useState<string>(initialDigits)
    const [displayValue, setDisplayValue] = useState<string>(formatPhoneNumber(initialDigits))

    function toDigits(input: string) {
      return input.replace(/\D/g, '').slice(0, 13)
    }

    function formatPhoneNumber(digits: string) {
      if (digits.length <= 4) {
        return digits
      } else if (digits.length <= 8) {
        return `${digits.slice(0, 4)} - ${digits.slice(4)}`
      } else {
        return `${digits.slice(0, 4)} - ${digits.slice(4, 8)} - ${digits.slice(8)}`
      }
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const digits = toDigits(e.target.value)
      setRawValue(digits)
      setDisplayValue(formatPhoneNumber(digits))

      e.target.value = digits
      props.onChange?.(e)
    }

    return (
      <>
        <input type="hidden" name={props.name} value={rawValue} />
        <Input
          {...props}
          className={className}
          value={displayValue}
          onChange={handleChange}
          maxLength={19}
          name={undefined}
          ref={ref}
        />
      </>
    )
  }
)

export { PhoneInput }

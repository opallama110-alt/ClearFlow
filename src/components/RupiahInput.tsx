import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { formatRupiahInput, parseRupiahInput } from '../lib/format'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number
  onValueChange: (value: number) => void
}

/**
 * Input nominal yang menerima "1 jt", "250rb", atau "1.500.000" lalu merapikannya
 * menjadi format ribuan saat fokus berpindah.
 */
export default function RupiahInput({ value, onValueChange, placeholder = '0 atau 1 jt', ...rest }: Props) {
  const [focused, setFocused] = useState(false)
  const [rawValue, setRawValue] = useState(() => formatRupiahInput(value))

  useEffect(() => {
    if (!focused) setRawValue(formatRupiahInput(value))
  }, [focused, value])

  return (
    <input
      {...rest}
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      maxLength={30}
      value={rawValue}
      placeholder={placeholder}
      onFocus={(event) => {
        setFocused(true)
        event.currentTarget.select()
      }}
      onChange={(event) => {
        const next = event.target.value
        setRawValue(next)
        onValueChange(parseRupiahInput(next))
      }}
      onBlur={() => {
        const parsed = parseRupiahInput(rawValue)
        onValueChange(parsed)
        setRawValue(formatRupiahInput(parsed))
        setFocused(false)
      }}
    />
  )
}

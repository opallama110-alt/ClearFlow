import { useEffect, useState } from 'react'
import { formatRupiahInput, parseRupiahInput } from '../lib/format'

type Props = {
  value: number
  onValueChange: (value: number) => void
  placeholder?: string
}

export default function RupiahInput({ value, onValueChange, placeholder = '0 atau 1 jt' }: Props) {
  const [focused, setFocused] = useState(false)
  const [rawValue, setRawValue] = useState(() => formatRupiahInput(value))

  useEffect(() => {
    if (!focused) setRawValue(formatRupiahInput(value))
  }, [focused, value])

  return (
    <input
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

type Props = { size?: 'small' | 'large'; withName?: boolean }

/** Logo ClearFlow, sama dengan favicon agar identitas visual konsisten. */
export default function BrandMark({ size = 'small', withName = false }: Props) {
  return (
    <span className={`brand ${size === 'large' ? 'brand-large' : ''}`}>
      <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <rect width="64" height="64" rx="18" fill="currentColor" />
        <path fill="#fff" d="M45.4 20.8a18 18 0 1 0 0 22.4l-5.5-4.6a10.7 10.7 0 1 1 0-13.2l5.5-4.6Z" />
      </svg>
      {withName && <strong className="brand-name">ClearFlow<span>.AI</span></strong>}
    </span>
  )
}

import { useEffect } from 'react'
import { CheckCircle2, FileClock, Sparkles, WalletCards, X } from 'lucide-react'

type Props = {
  step: number
  onNext: () => void
  onSkip: () => void
  onStart: () => void
}

const steps = [
  {
    eyebrow: 'LANGKAH 1',
    title: 'Catat seperti sedang bercerita',
    copy: 'Tulis kejadian dan nominal dengan bahasa sehari-hari. Singkatan seperti rb, ribu, jt, dan juta akan dibaca sebagai Rupiah.',
    example: 'Jualan 300rb, lalu beli bahan 1 jt pakai uang pribadi.',
    icon: <Sparkles size={31} />,
  },
  {
    eyebrow: 'LANGKAH 2',
    title: 'Gemini hanya menyiapkan draft',
    copy: 'ClearFlow mengubah cerita menjadi draft terstruktur. Periksa nominal, arus kas, sumber dana, dan kategori sebelum menyimpan.',
    example: 'Cerita → draft transaksi → Anda periksa → tersimpan',
    icon: <CheckCircle2 size={31} />,
  },
  {
    eyebrow: 'LANGKAH 3',
    title: 'Pisahkan uang usaha dan pribadi',
    copy: 'Pilih Kas Usaha atau Dana Pribadi pada setiap transaksi. Saldo keduanya dihitung terpisah agar modal lebih mudah dipantau.',
    example: 'Belanja stok dengan uang sendiri? Pilih Dana Pribadi.',
    icon: <WalletCards size={31} />,
  },
  {
    eyebrow: 'LANGKAH 4',
    title: 'Anda tetap memegang kendali',
    copy: 'Cari, ubah, atau hapus transaksi dari Riwayat. Anda juga dapat mengunduh CSV kapan saja untuk diperiksa kembali.',
    example: 'ClearFlow mulai tanpa transaksi contoh. Hanya catatan Anda yang tampil.',
    icon: <FileClock size={31} />,
  },
] as const

export default function ProductTour({ step, onNext, onSkip, onStart }: Props) {
  const current = steps[step] ?? steps[0]
  const isLast = step === steps.length - 1

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', closeWithEscape)
    return () => window.removeEventListener('keydown', closeWithEscape)
  }, [onSkip])

  return (
    <div className="tour-backdrop">
      <section className="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-copy">
        <button className="tour-close" type="button" onClick={onSkip} aria-label="Lewati panduan"><X size={19} /></button>
        <div className="tour-progress" aria-label={`Langkah ${step + 1} dari ${steps.length}`}>
          {steps.map((item, index) => <span className={index <= step ? 'active' : ''} key={item.title} />)}
        </div>
        <div className="tour-visual" aria-hidden="true"><span>{current.icon}</span></div>
        <p className="eyebrow">{current.eyebrow} DARI {steps.length}</p>
        <h2 id="tour-title">{current.title}</h2>
        <p className="tour-copy" id="tour-copy">{current.copy}</p>
        <div className="tour-example">{current.example}</div>
        <div className="tour-actions">
          <button className="tour-skip" type="button" onClick={onSkip}>Lewati</button>
          <button className="primary-button tour-next" type="button" onClick={isLast ? onStart : onNext}>
            {isLast ? 'Mulai mencatat' : 'Lanjut'}
          </button>
        </div>
      </section>
    </div>
  )
}

import { CheckCircle2, FileClock, Sparkles, WalletCards, X } from 'lucide-react'
import Modal from './Modal'

type Props = {
  step: number
  onNext: (nextStep: number) => void
  onBack: () => void
  onSkip: () => void
  onStart: () => void
}

const TOUR_STEPS = [
  {
    title: 'Catat seperti sedang bercerita',
    copy: 'Tulis kejadian dan nominal dengan bahasa sehari-hari. Singkatan seperti rb, ribu, jt, dan juta akan dibaca sebagai Rupiah.',
    example: 'Jualan 300rb, lalu beli bahan 1 jt pakai uang pribadi.',
    icon: <Sparkles size={31} />,
  },
  {
    title: 'Gemini hanya menyiapkan draft',
    copy: 'ClearFlow mengubah cerita menjadi draft terstruktur. Periksa nominal, arus kas, sumber dana, dan kategori sebelum menyimpan.',
    example: 'Cerita → draft transaksi → Anda periksa → tersimpan',
    icon: <CheckCircle2 size={31} />,
  },
  {
    title: 'Pisahkan uang usaha dan pribadi',
    copy: 'Pilih Kas Usaha atau Dana Pribadi pada setiap transaksi. Saldo keduanya dihitung terpisah agar modal lebih mudah dipantau.',
    example: 'Belanja stok dengan uang sendiri? Pilih Dana Pribadi.',
    icon: <WalletCards size={31} />,
  },
  {
    title: 'Anda tetap memegang kendali',
    copy: 'Cari, ubah, atau hapus transaksi dari Riwayat. Anda juga dapat mengunduh CSV kapan saja, bahkan saat offline.',
    example: 'ClearFlow mulai tanpa transaksi contoh. Hanya catatan Anda yang tampil.',
    icon: <FileClock size={31} />,
  },
] as const

export default function ProductTour({ step, onNext, onBack, onSkip, onStart }: Props) {
  const current = TOUR_STEPS[step] ?? TOUR_STEPS[0]
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <Modal labelledBy="tour-title" describedBy="tour-copy" onClose={onSkip} className="tour-card">
      <button className="icon-button tour-close" type="button" onClick={onSkip} aria-label="Lewati panduan"><X size={19} /></button>
      <div className="tour-progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOUR_STEPS.length} aria-valuenow={step + 1} aria-label={`Langkah ${step + 1} dari ${TOUR_STEPS.length}`}>
        {TOUR_STEPS.map((item, index) => <span className={index <= step ? 'active' : ''} key={item.title} />)}
      </div>
      <div className="tour-visual" aria-hidden="true"><span key={step}>{current.icon}</span></div>
      <p className="eyebrow">Langkah {step + 1} dari {TOUR_STEPS.length}</p>
      <h2 id="tour-title">{current.title}</h2>
      <p className="tour-copy" id="tour-copy">{current.copy}</p>
      <div className="tour-example">{current.example}</div>
      <div className="tour-actions">
        {step > 0
          ? <button className="ghost-button" type="button" onClick={onBack}>Kembali</button>
          : <button className="ghost-button" type="button" onClick={onSkip}>Lewati</button>}
        <button className="primary-button" type="button" onClick={isLast ? onStart : () => onNext(step + 1)} data-autofocus>
          {isLast ? 'Mulai mencatat' : 'Lanjut'}
        </button>
      </div>
    </Modal>
  )
}

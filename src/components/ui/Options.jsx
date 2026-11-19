/** ชุดตัวเลือกที่ใช้ซ้ำในหน้าปรับแต่ง (radio group ที่เข้าถึงได้ด้วยคีย์บอร์ด) */

export function Field({ label, hint, children }) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-baseline justify-between text-sm text-gold-200">
        <span>{label}</span>
        {hint && <span className="text-[11px] text-gold-100/50">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

export function Chips({ options, value, onChange, name }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              on ? 'border-gold-300 bg-gold-400 text-night-950 shadow-[0_0_16px_-2px_rgba(239,197,90,0.7)]' : 'border-gold-400/25 bg-night-900/60 text-gold-100/85 hover:border-gold-400/60'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Swatches({ options, value, onChange, name }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.id)}
            className={`h-9 w-9 rounded-full border-2 transition ${on ? 'scale-110 border-gold-200 shadow-[0_0_0_3px_rgba(239,197,90,0.35)]' : 'border-white/10 hover:scale-105'}`}
            style={{ background: o.color }}
          />
        )
      })}
    </div>
  )
}

export function Cards({ options, value, onChange, name, render, cols = 'grid-cols-2' }) {
  return (
    <div role="radiogroup" aria-label={name} className={`grid gap-2 ${cols}`}>
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`flex items-center gap-2 rounded-2xl border p-2 text-left transition ${
              on ? 'border-gold-300 bg-gold-400/12 shadow-[0_0_20px_-6px_rgba(239,197,90,0.8)]' : 'border-gold-400/15 bg-night-900/60 hover:border-gold-400/50'
            }`}
          >
            {render?.(o, on)}
            <span className="min-w-0">
              <span className={`block text-sm ${on ? 'text-gold-200' : 'text-gold-100'}`}>{o.label}</span>
              {o.desc && <span className="block text-[11px] leading-tight text-gold-100/55">{o.desc}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

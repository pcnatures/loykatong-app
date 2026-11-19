/** หมุดรูปเปลวเทียนบนกระทง ใช้ร่วมกันทั้ง Google Maps (JSX) และ Leaflet (HTML string) */
const fillOf = (variant) => (variant === 'custom' ? '#ff7aa8' : variant === 'active' ? '#f6d985' : '#e0ac3c')

export const pinHtml = (variant = 'default') => `
<div class="lk-pin" data-active="${variant !== 'default'}">
  <svg viewBox="0 0 38 46" width="38" height="46" aria-hidden="true">
    <path d="M19 45C19 45 3 28 3 17a16 16 0 0 1 32 0c0 11-16 28-16 28z" fill="${fillOf(variant)}" stroke="#fff6dc" stroke-width="2"/>
    <circle cx="19" cy="17" r="10" fill="#081230"/>
    <path d="M19 8.5c2.8 3.4 3.4 5.8 0 9-3.4-3.2-2.8-5.6 0-9z" fill="#ffc24a"/>
    <path d="M11.5 19.5c3.4 3.4 11.6 3.4 15 0l-2.2 3.4h-10.6z" fill="#6fb04f"/>
  </svg>
</div>`

export function PinMarker({ variant = 'default' }) {
  return <div dangerouslySetInnerHTML={{ __html: pinHtml(variant) }} />
}

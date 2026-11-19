import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* เคารพการตั้งค่า "ลดการเคลื่อนไหว" ของระบบปฏิบัติการ */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)

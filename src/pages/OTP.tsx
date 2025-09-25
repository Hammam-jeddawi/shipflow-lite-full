
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { localAPI } from '../services/local'

export default function OTP(){
  const { role='customer', phone='' } = useParams()
  const [otp,setOtp] = useState('')
  const [error,setError] = useState<string|undefined>()
  const nav = useNavigate()

  async function onConfirm(){
    try{
      await localAPI.confirmLoginWithOtp(role as any, String(phone), otp)
      nav(role==='courier'? '/d' : '/c')
    }catch(err:any){ setError(err.message || String(err)) }
  }

  return (
    <div className="card">
      <h2>إدخال رمز التحقق (OTP)</h2>
      <p className="muted">تم إرسال رمز تحقق (وهمي) إلى {phone}. انظر Console.</p>
      <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="رمز مكون من 6 أرقام"/>
      {error && <div style={{color:'#f87171'}}>{error}</div>}
      <div className="spacer"></div>
      <button className="primary" onClick={onConfirm}>تأكيد</button>
    </div>
  )
}

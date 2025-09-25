
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { localAPI } from '../services/local'

export default function Login(){
  const { role='customer' } = useParams()
  const nav = useNavigate()
  const [phone,setPhone] = useState('')
  const [password,setPassword] = useState('')
  const [name,setName] = useState('')
  const [mode,setMode] = useState<'login'|'register'>('login')
  const [error,setError] = useState<string|undefined>()

  async function onSubmit(e:any){
    e.preventDefault(); setError(undefined)
    try{
      if(!/^\d{10}$/.test(phone)) throw new Error('رقم الجوال يجب أن يكون 10 أرقام')
      if (mode==='register'){
        await localAPI.register(role as any, name || 'مستخدم', phone, password)
      }else{
        await localAPI.requestOtpForLogin(role as any, phone, password)
      }
      nav(`/otp/${role}/${phone}`)
    }catch(err:any){ setError(err.message || String(err)) }
  }

  return (
    <div className="card">
      <h2>تسجيل {role==='courier'?'المندوب':'العميل'}</h2>
      <div className="spacer"></div>
      <div className="row">
        <button onClick={()=>setMode('login')} className="primary">تسجيل دخول</button>
        <button onClick={()=>setMode('register')}>إنشاء حساب</button>
      </div>
      <div className="spacer"></div>
      <form onSubmit={onSubmit}>
        {mode==='register' && (<>
          <label>الاسم</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسمك"/>
        </>)}
        <div className="spacer"></div>
        <label>رقم الجوال (10 أرقام)</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="05xxxxxxxx"/>
        <div className="spacer"></div>
        <label>كلمة المرور</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
        <div className="spacer"></div>
        {error && <div style={{color:'#f87171'}}>{error}</div>}
        <button className="primary" type="submit">{mode==='register'?'متابعة':'الحصول على رمز (OTP)'}</button>
      </form>
    </div>
  )
}

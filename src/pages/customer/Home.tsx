
import { useEffect, useState } from 'react'
import { localAPI } from '../../services/local'
import { Link, useNavigate } from 'react-router-dom'

export default function CustomerHome(){
  const nav = useNavigate()
  const [current, setCurrent] = useState<any[]>([])
  const [previous, setPrevious] = useState<any[]>([])

  function refresh(){
    try{
      setCurrent(localAPI.listCustomerShipments('current'))
      setPrevious(localAPI.listCustomerShipments('previous'))
    }catch{
      nav('/login/customer')
    }
  }

  useEffect(()=>{ refresh() }, [])

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2>لوحة العميل</h2>
        <div className="row">
          <button className="danger" onClick={()=>{ localAPI.logout(); nav('/login/customer') }}>تسجيل الخروج</button>
        </div>
      </div>

      <div className="spacer"></div>
      <button className="primary" onClick={()=>{
        const mall = window.prompt('اختَر المول (اكتب: ردسي مول أو العرب مول):','ردسي مول')
        if (mall) {
          const s = localAPI.createShipment(mall)
          nav(`/c/s/${s.id}`)
        }
      }}>شحنة جديدة</button>

      <div className="spacer"></div>
      <div className="card">
        <h3>شحناتي الحالية</h3>
        <table>
          <thead><tr><th>#</th><th>الكود</th><th>الحالة</th><th>المول</th><th></th></tr></thead>
          <tbody>
            {current.map((s,i)=> (
              <tr key={s.id}>
                <td>{i+1}</td><td>{s.code}</td><td>{s.status}</td><td>{s.mall||'-'}</td>
                <td><Link to={`/c/s/${s.id}`}>فتح</Link></td>
              </tr>
            ))}
            {current.length===0 && <tr><td colSpan={5} className="muted">لا توجد شحنات حالية</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="spacer"></div>
      <div className="card">
        <h3>الشحنات السابقة</h3>
        <table>
          <thead><tr><th>#</th><th>الكود</th><th>الحالة</th></tr></thead>
          <tbody>
            {previous.map((s,i)=> (
              <tr key={s.id}><td>{i+1}</td><td>{s.code}</td><td>{s.status}</td></tr>
            ))}
            {previous.length===0 && <tr><td colSpan={3} className="muted">لا توجد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { localAPI } from '../../services/local'
import { Link, useNavigate } from 'react-router-dom'

export default function CourierHome(){
  const nav=useNavigate()
  const [available,setAvailable] = useState<any[]>([])
  const [mine,setMine] = useState<any[]>([])

  function refresh(){
    try{
      setAvailable(localAPI.listAvailableForCouriers())
      setMine(localAPI.listMyCourierShipments())
    }catch{
      nav('/login/courier')
    }
  }
  useEffect(()=>{ refresh() }, [])

  function accept(id:string){
    localAPI.assignCourier(id); refresh()
  }

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2>لوحة المندوب</h2>
        <button className="danger" onClick={()=>{ localAPI.logout(); nav('/login/courier') }}>تسجيل الخروج</button>
      </div>

      <div className="card">
        <h3>شحنات متاحة</h3>
        <table>
          <thead><tr><th>#</th><th>الكود</th><th>المول</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {available.map((s,i)=> (
              <tr key={s.id}>
                <td>{i+1}</td><td>{s.code}</td><td>{s.mall||'-'}</td><td>{s.status}</td>
                <td><button className="primary" onClick={()=>accept(s.id)}>قبول</button></td>
              </tr>
            ))}
            {available.length===0 && <tr><td colSpan={5} className="muted">لا توجد</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="spacer"></div>
      <div className="card">
        <h3>شحناتي</h3>
        <table>
          <thead><tr><th>#</th><th>الكود</th><th>المول</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {mine.map((s,i)=> (
              <tr key={s.id}>
                <td>{i+1}</td><td>{s.code}</td><td>{s.mall||'-'}</td><td>{s.status}</td>
                <td><Link to={`/d/s/${s.id}`}>فتح</Link></td>
              </tr>
            ))}
            {mine.length===0 && <tr><td colSpan={5} className="muted">لا توجد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

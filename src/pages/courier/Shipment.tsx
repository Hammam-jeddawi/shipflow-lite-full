
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { localAPI } from '../../services/local'

export default function CourierShipment(){
  const { id='' } = useParams()
  const nav = useNavigate()
  const [s,setS] = useState<any|null>(null)

  function load(){
    const x = localAPI.getShipmentById(String(id))
    if (!x) { nav('/d'); return }
    setS(x)
  }
  useEffect(()=>{ load() }, [])

  if (!s) return <div/>

  function toggleItem(itemId:string, next:boolean){
    if (!confirm(next? 'تأكيد: وضع العنصر تم التجميع؟' : 'تأكيد: إرجاعه إلى جاهز للتجميع؟')) return
    localAPI.courierMarkItemPicked(s.id, itemId, next); load()
  }
  function deliver(){
    if (!confirm('تأكيد: تم التسليم؟')) return
    try{ localAPI.courierMarkDelivered(s.id); load() }catch(err:any){ alert(err.message||String(err)) }
  }

  const canDeliver = !!s.pickupAddressId && (s.status==='locked' || s.status==='in_transit' || s.status==='delivered')

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2>شحنة: {s.code}</h2>
        <button className="danger" onClick={()=>{ localAPI.logout(); nav('/login/courier') }}>تسجيل الخروج</button>
      </div>

      <div className="card">
        <h3>الطلبات الداخلية</h3>
        <table>
          <thead><tr><th>#</th><th>المحل</th><th>رقم الفاتورة</th><th>المبلغ</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {s.items.map((it:any,idx:number)=> (
              <tr key={it.id}>
                <td>{idx+1}</td><td>{it.storeName}</td><td>{it.invoiceNumber}</td><td>{it.invoiceAmount??'-'}</td>
                <td>{it.pickedByCourier? 'تم التجميع':'جاهز للتجميع'}</td>
                <td>
                  <button onClick={()=>toggleItem(it.id, !it.pickedByCourier)}>
                    {it.pickedByCourier? 'إرجاع كـ جاهز':'وضع كـ تم التجميع'}
                  </button>
                </td>
              </tr>
            ))}
            {s.items.length===0 && <tr><td colSpan={6} className="muted">لا عناصر</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="spacer"></div>
      {canDeliver && (
        <div className="card">
          <h3>التسليم</h3>
          <p className="muted">الموقع محدد من العميل؛ يمكنك إنهاء التسليم.</p>
          <button className="primary" onClick={deliver}>تم التسليم</button>
        </div>
      )}
      {!canDeliver && (
        <div className="card">
          <p className="muted">ينتظر تحديد موقع الاستلام من العميل (وإنهاء التسوق).</p>
        </div>
      )}
    </div>
  )
}

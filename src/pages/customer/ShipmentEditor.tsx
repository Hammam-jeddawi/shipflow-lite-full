
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { localAPI } from '../../services/local'

export default function ShipmentEditor(){
  const { id='' } = useParams()
  const nav = useNavigate()
  const [s,setS] = useState<any|null>(null)
  const [storeName,setStoreName] = useState('')
  const [invoiceNumber,setInvoiceNumber] = useState('')
  const [amount,setAmount] = useState<number|undefined>(undefined)
  const [pickupId,setPickupId] = useState<string>('')
  const [newAddress,setNewAddress] = useState('')

  function load(){
    const x = localAPI.getShipmentById(String(id))
    if (!x) { nav('/c'); return }
    setS(x)
  }
  useEffect(()=>{ load() }, [])

  if (!s) return <div/>

  const isLocked = s.status==='locked' || s.status==='delivered'

  function addItem(){
    try{
      localAPI.addShipmentItem(s.id, { storeName, invoiceNumber, invoiceAmount: amount })
      setStoreName(''); setInvoiceNumber(''); setAmount(undefined); load()
    }catch(err:any){ alert(err.message || String(err)) }
  }

  function createAddress(){
    if (!newAddress) return
    const a = localAPI.addAddress(newAddress, newAddress, false)
    setPickupId(a.id); setNewAddress('')
    alert('تمت إضافة العنوان.')
  }

  function endShopping(){
    try{
      if (!pickupId) { alert('اختر/أضف موقع الاستلام'); return }
      localAPI.endShopping(s.id, pickupId); load()
    }catch(err:any){ alert(err.message || String(err)) }
  }

  function confirmReceived(){
    if (confirm('تأكيد استلام الشحنة؟')){
      localAPI.customerConfirmReceived(s.id); nav('/c')
    }
  }

  const profile = localAPI.getProfile()
  const addresses = profile?.addresses || []

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2>شحنة: {s.code}</h2>
        <button className="danger" onClick={()=>{ localAPI.logout(); nav('/login/customer') }}>تسجيل الخروج</button>
      </div>
      <p className="muted">المول: <b>{s.mall||'-'}</b></p>

      <div className="card">
        <h3>إضافة طلب داخلي</h3>
        <div className="row">
          <input disabled={isLocked} placeholder="اسم المحل" value={storeName} onChange={e=>setStoreName(e.target.value)}/>
          <input disabled={isLocked} placeholder="رقم الفاتورة" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)}/>
          <input disabled={isLocked} placeholder="مبلغ الفاتورة (اختياري)" value={amount??''} onChange={e=>setAmount(Number(e.target.value)||undefined)}/>
          <button disabled={isLocked} className="primary" onClick={addItem}>إضافة</button>
        </div>
      </div>

      <div className="spacer"></div>
      <div className="card">
        <h3>العناصر</h3>
        <table>
          <thead><tr><th>#</th><th>اسم المحل</th><th>رقم الفاتورة</th><th>المبلغ</th><th>حالة المندوب</th></tr></thead>
          <tbody>
            {s.items.map((it:any,idx:number)=> (
              <tr key={it.id}>
                <td>{idx+1}</td><td>{it.storeName}</td><td>{it.invoiceNumber}</td><td>{it.invoiceAmount??'-'}</td>
                <td>{it.pickedByCourier? 'تم التجميع' : 'جاهز للتجميع'}</td>
              </tr>
            ))}
            {s.items.length===0 && <tr><td colSpan={5} className="muted">لا عناصر بعد</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="spacer"></div>
      {s.status!=='delivered' ? (
        <div className="card">
          <h3>إنهاء التسوق + تحديد موقع الاستلام</h3>
          <div className="row">
            <select disabled={isLocked} value={pickupId} onChange={e=>setPickupId(e.target.value)}>
              <option value="">— اختر عنواناً محفوظاً —</option>
              {addresses.map((a:any)=> <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <input disabled={isLocked} placeholder="أو أضف عنواناً جديداً" value={newAddress} onChange={e=>setNewAddress(e.target.value)}/>
            <button disabled={isLocked} onClick={createAddress}>إضافة عنوان</button>
            <button disabled={isLocked || s.items.length===0 || !pickupId} className="primary" onClick={endShopping}>إنهاء التسوق</button>
          </div>
          <p className="muted">لا يمكن إنهاء التسوق بدون عناصر وموقع استلام.</p>
        </div>
      ) : (
        <div className="card">
          <h3>تم تسليم الشحنة من المندوب</h3>
          <button className="primary" onClick={confirmReceived}>تم استلام الشحنة</button>
        </div>
      )}

    </div>
  )
}

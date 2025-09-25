
/** Local data & auth (LocalStorage). Arabic-friendly. */

type Role = 'customer'|'courier'|'admin'

export type ShipmentStatus =
  | 'draft'
  | 'locked'
  | 'assigned'
  | 'in_transit'
  | 'delivered'

export interface User {
  id: string
  role: Role
  phone: string
  name: string
  passwordHash: string
  createdAt: number
}

export interface Address {
  id: string
  userId: string
  label: string
  formatted?: string
  isDefault?: boolean
}

export interface ShipmentItem {
  id: string
  shipmentId: string
  storeName: string
  invoiceNumber: string
  invoiceAmount?: number
  pickedByCourier?: boolean
  createdAt: number
}

export interface Shipment {
  id: string
  code: string
  customerId: string
  status: ShipmentStatus
  lockedAt?: number
  lockedByAction?: boolean
  assignedCourierId?: string|null
  mall?: string|null
  pickupAddressId?: string|null
  items: ShipmentItem[]
  createdAt: number
  customerConfirmed?: boolean
}

export interface DB {
  version: 5
  users: User[]
  addresses: Address[]
  shipments: Shipment[]
  otps: Record<string, { code: string; exp: number; role: Role } | undefined>
}

const DB_KEY = 'shipflow_db_v5'
const SESSION_KEY = 'shipflow_session_v1'

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function now(){ return Date.now() }
function sha(s:string){ return Array.from(new TextEncoder().encode(s)).map(b=>b.toString(16).padStart(2,'0')).join('') }

function load(): DB{
  const raw = localStorage.getItem(DB_KEY)
  if (!raw){
    const seeded: DB = { version:5, users:[], addresses:[], shipments:[], otps:{} }
    localStorage.setItem(DB_KEY, JSON.stringify(seeded))
    return seeded
  }
  const db = JSON.parse(raw) as DB
  migration_fix(db)
  return db
}
function save(db:DB){ localStorage.setItem(DB_KEY, JSON.stringify(db)) }

function setSession(u:User|null){
  if (u) localStorage.setItem(SESSION_KEY, JSON.stringify({ id: u.id, role: u.role }))
  else localStorage.removeItem(SESSION_KEY)
}
export function getSession(): { id:string; role: Role } | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function migration_fix(db: DB){
  let changed=false
  for (const s of db.shipments){
    if (s.status==='locked' && (!s.pickupAddressId || !s.lockedByAction)){
      s.status='draft'; s.lockedAt=undefined; s.lockedByAction=false; changed=true
    }
    if (s.items==null) s.items = []
    if (s.assignedCourierId===undefined) s.assignedCourierId=null
    if (s.customerConfirmed===undefined) s.customerConfirmed=false
  }
  if (changed) save(db)
}

// ---------- Auth & OTP (mock) ----------
function findUser(db:DB, role:Role, phone:string){
  return db.users.find(u=>u.role===role && u.phone===phone)
}

async function register(role:Role, name:string, phone:string, password:string){
  const db=load()
  if (!/^\d{10}$/.test(phone)) throw new Error('INVALID_PHONE')
  if (findUser(db, role, phone)) throw new Error('USER_EXISTS')
  const u:User = { id:uid(), role, phone, name, passwordHash: sha(password), createdAt: now() }
  db.users.push(u); save(db)
  await requestOtpForLogin(role, phone, password)
  return true
}

async function requestOtpForLogin(role:Role, phone:string, password:string){
  const db=load()
  const u = findUser(db, role, phone)
  if (!u) throw new Error('USER_NOT_FOUND')
  if (u.passwordHash !== sha(password)) throw new Error('BAD_PASSWORD')
  const code = String(Math.floor(100000 + Math.random()*900000))
  db.otps[phone] = { code, exp: now()+5*60*1000, role }
  save(db)
  console.log(`OTP to ${phone}: ${code}`)
  return true
}

async function confirmLoginWithOtp(role:Role, phone:string, otp:string){
  const db=load()
  const e = db.otps[phone]
  if (!e || e.role!==role || e.exp<now() || e.code!==otp) throw new Error('OTP_BAD')
  const u = findUser(db, role, phone)!
  setSession(u); delete db.otps[phone]; save(db)
  return u
}

function logout(){ setSession(null) }

// ---------- Addresses ----------
function addAddress(label:string, formatted?:string, isDefault=false){
  const sess = getSession(); if (!sess) throw new Error('UNAUTH')
  const db=load()
  const a: Address = { id:uid(), userId: sess.id, label, formatted, isDefault }
  if (isDefault){
    for (const x of db.addresses.filter(x=>x.userId===sess.id)) x.isDefault=false
  }
  db.addresses.push(a); save(db); return a
}
function getProfile(){
  const sess=getSession(); if(!sess) return null
  const db=load()
  const me=db.users.find(u=>u.id===sess.id)!
  const addresses=db.addresses.filter(a=>a.userId===sess.id)
  return { me, addresses }
}

// ---------- Shipments ----------
function genCode(){
  const d=new Date()
  const pad=(n:number)=> String(n).padStart(2,'0')
  return `SHP-${String(d.getFullYear()).slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.floor(Math.random()*9000+1000)}`
}

function createShipment(mall:string|null){
  const sess=getSession(); if(!sess || sess.role!=='customer') throw new Error('UNAUTH')
  const db=load()
  const s:Shipment = { id:uid(), code:genCode(), customerId: sess.id, status:'draft', lockedByAction:false,
    assignedCourierId:null, pickupAddressId:null, mall: mall||null, items:[], createdAt: now(), customerConfirmed:false }
  db.shipments.push(s); save(db); return s
}

function listCustomerShipments(kind:'current'|'previous'='current'){
  const sess=getSession(); if(!sess || sess.role!=='customer') throw new Error('UNAUTH')
  const db=load()
  const all = db.shipments.filter(s=>s.customerId===sess.id)
  if (kind==='previous') return all.filter(s=>s.customerConfirmed===true)
  return all.filter(s=>!s.customerConfirmed)
}

function getShipmentById(id:string){
  const db=load(); return db.shipments.find(s=>s.id===id) || null
}

function addShipmentItem(shipmentId:string, data:{ storeName:string; invoiceNumber:string; invoiceAmount?:number }){
  const sess=getSession(); if(!sess || sess.role!=='customer') throw new Error('UNAUTH')
  const db=load(); const s=db.shipments.find(x=>x.id===shipmentId)!
  if (s.status==='locked') throw new Error('LOCKED')
  const it:ShipmentItem={ id:uid(), shipmentId:s.id, storeName:data.storeName, invoiceNumber:data.invoiceNumber,
    invoiceAmount:data.invoiceAmount, pickedByCourier:false, createdAt:Date.now() }
  s.items.push(it); save(db); return it
}

function endShopping(shipmentId:string, pickupAddressId:string){
  const sess=getSession(); if(!sess || sess.role!=='customer') throw new Error('UNAUTH')
  const db=load(); const s=db.shipments.find(x=>x.id===shipmentId)!
  if (!pickupAddressId) throw new Error('PICKUP_REQUIRED')
  if (s.items.length===0) throw new Error('NO_ITEMS')
  s.pickupAddressId = pickupAddressId; s.status='locked'; s.lockedAt=Date.now(); s.lockedByAction=true
  save(db); return s
}

function assignCourier(shipmentId:string){
  const sess=getSession(); if(!sess || sess.role!=='courier') throw new Error('UNAUTH')
  const db=load(); const s=db.shipments.find(x=>x.id===shipmentId)!
  s.assignedCourierId = sess.id; save(db); return s
}

function listAvailableForCouriers(){
  const sess=getSession(); if(!sess || sess.role!=='courier') throw new Error('UNAUTH')
  const db=load(); return db.shipments.filter(s=>!s.assignedCourierId)
}
function listMyCourierShipments(){
  const sess=getSession(); if(!sess || sess.role!=='courier') throw new Error('UNAUTH')
  const db=load(); return db.shipments.filter(s=>s.assignedCourierId===sess.id)
}

function courierMarkItemPicked(shipmentId:string, itemId:string, picked:boolean){
  const sess=getSession(); if(!sess || sess.role!=='courier') throw new Error('UNAUTH')
  const db=load(); const s=db.shipments.find(x=>x.id===shipmentId)!
  const it=s.items.find(i=>i.id===itemId)!; it.pickedByCourier = picked; save(db); return true
}

function courierMarkDelivered(shipmentId:string){
  const sess=getSession(); if(!sess || sess.role!=='courier') throw new Error('UNAUTH')
  const db=load(); const s=db.shipments.find(x=>x.id===shipmentId)!
  if (!s.pickupAddressId) throw new Error('NO_PICKUP') // لا تظهر إلا عند وجود موقع
  s.status='delivered'; save(db); return true
}

function customerConfirmReceived(shipmentId:string){
  const sess=getSession(); if(!sess || sess.role!=='customer') throw new Error('UNAUTH')
  const db=load(); const s=db.shipments.find(x=>x.id===shipmentId)!
  s.customerConfirmed = true; save(db); return true
}

export const localAPI = {
  // auth
  register, requestOtpForLogin, confirmLoginWithOtp, logout, getSession,
  // profile & addresses
  getProfile, addAddress,
  // shipments
  createShipment, listCustomerShipments, getShipmentById, addShipmentItem, endShopping,
  assignCourier, listAvailableForCouriers, listMyCourierShipments, courierMarkItemPicked,
  courierMarkDelivered, customerConfirmReceived
}

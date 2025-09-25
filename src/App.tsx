
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import OTP from './pages/OTP'
import CustomerHome from './pages/customer/Home'
import ShipmentEditor from './pages/customer/ShipmentEditor'
import CourierHome from './pages/courier/Home'
import CourierShipment from './pages/courier/Shipment'

export default function App(){
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Navigate to="/login/customer" replace/>} />
        <Route path="/login/:role" element={<Login/>} />
        <Route path="/otp/:role/:phone" element={<OTP/>}/>

        <Route path="/c" element={<CustomerHome/>}/>
        <Route path="/c/s/:id" element={<ShipmentEditor/>}/>

        <Route path="/d" element={<CourierHome/>}/>
        <Route path="/d/s/:id" element={<CourierShipment/>}/>

        <Route path="*" element={<h3>Not found</h3>} />
      </Routes>
    </div>
  )
}

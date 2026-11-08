import { useState, useEffect } from "react";
import "./Module1.css";
import { SharedEVService } from "../../services/SharedEVService";

type Vehicle = { id: string; code: string; name: string; type: string; hubId: string; batteryLevel: number; status: string; rangeKm: number };
type Reservation = { id: string; vehicleId: string; hubId: string; createdAt: string; status: string };

const HUBS = [{ id: "hub-metro", name: "Metro Hub" }, { id: "hub-ktxb", name: "Dorm Hub" }];
const formatHub = (id: string) => HUBS.find((h) => h.id === id)?.name ?? id;

export function Module1SharedEV() {
  const [activeTab, setActiveTab] = useState<"find"|"reserve"|"pickup"|"return">("find");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SharedEVService.getAllVehicles().then(veh => {
      const transformed = veh.map(v => ({
        id: v.id, code: v.code, name: v.name || v.code, type: v.type || "EV",
        hubId: v.hubId, batteryLevel: v.batteryLevel, status: v.status || "AVAILABLE", rangeKm: v.rangeKm || 0
      }));
      setVehicles(transformed);
      if (transformed.length) setSelectedId(transformed[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selected = vehicles.find(v => v.id === selectedId);
  const reservation = reservations[0];
  const filtered = vehicles.filter(v => v.status === "AVAILABLE");

  return (
    <div className="module4-container">
      <div className="module4-tabs">
        <button className={activeTab==="find"?"tab-button active":"tab-button"} onClick={()=>setActiveTab("find")}>Find</button>
        <button className={activeTab==="reserve"?"tab-button active":"tab-button"} onClick={()=>setActiveTab("reserve")}>Reserve</button>
        <button className={activeTab==="pickup"?"tab-button active":"tab-button"} onClick={()=>setActiveTab("pickup")}>Pickup</button>
        <button className={activeTab==="return"?"tab-button active":"tab-button"} onClick={()=>setActiveTab("return")}>Return</button>
      </div>
      <div className="module4-content">
        <div className="page-container">
          <div className="page-heading"><h1>Shared EV Management</h1></div>
          {loading?<p>Loading...</p>:activeTab==="find"&&<section className="content-card"><h2>Available Vehicles</h2><div className="vehicle-grid">{filtered.map(v=><button key={v.id} className={selected?.id===v.id?"vehicle-card selected":"vehicle-card"} onClick={()=>setSelectedId(v.id)}><h3>{v.name}</h3><p>{v.batteryLevel}%</p></button>)}</div>{selected&&<button onClick={async()=>{const r=await SharedEVService.reserveVehicle(selected.id);if(r.success){setReservations([{id:r.reservationId||"R",vehicleId:selected.id,hubId:selected.hubId,createdAt:new Date().toLocaleTimeString(),status:"Confirmed"}]);setActiveTab("reserve")}}}>Reserve</button>}</section>}
          {activeTab==="reserve"&&reservation&&<section className="content-card"><h2>Reservation</h2><p>{selected?.name}</p><p>Hub: {formatHub(selected?.hubId||"")}</p><button onClick={()=>{setReservations([]);setActiveTab("pickup")}}>Proceed to Pickup</button></section>}
        </div>
      </div>
    </div>
  );
}


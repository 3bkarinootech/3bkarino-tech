import { useEffect, useState } from "react";

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/invoices")
      .then(res => res.json())
      .then(data => setInvoices(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>حسابي 👤</h1>

      <h2>الفواتير</h2>

      {invoices.length === 0 ? (
        <p>لا يوجد فواتير</p>
      ) : (
        invoices.map((inv, i) => (
          <div key={i} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <p>رقم الفاتورة: {inv.id}</p>
            <p>الباقة: {inv.package}</p>
            <p>السعر: {inv.price} جنيه</p>
          </div>
        ))
      )}
    </div>
  );
}

// src/app/page.tsx
"use client";

import { useState } from "react";
import { DataTable } from "./components/DataTable";
import { Toaster } from "react-hot-toast";

export default function Home() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/invoices");
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-2 h-screen">
        <DataTable
          data={invoices}
          fetchData={fetchInvoices}
          isLoading={isLoading}
        />
      </main>
      <Toaster />
    </div>
  );
}

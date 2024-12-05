// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "./components/DataTable";
import { Toaster } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "./components/FileUpload";

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
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onUploadSuccess={fetchInvoices} />
            </CardContent>
          </Card>

          <DataTable
            data={invoices}
            fetchData={fetchInvoices}
            isLoading={isLoading}
          />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

'use client'

import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import { Invoice } from '@/models/Invoice'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { useState } from 'react'

interface InvoiceTableProps {
  invoices: Invoice[]
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [columnDefs] = useState<ColDef[]>([
    { field: 'invoiceNumber', headerName: 'Invoice #', sortable: true, filter: true },
    { field: 'issueDate', headerName: 'Issue Date', sortable: true, filter: true },
    { field: 'dueDate', headerName: 'Due Date', sortable: true, filter: true },
    { field: 'vendorName', headerName: 'Vendor', sortable: true, filter: true },
    { 
      field: 'subtotal', 
      headerName: 'Subtotal', 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(params.value)
      }
    },
    { 
      field: 'taxAmount', 
      headerName: 'Tax', 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
export default function InvoiceTable({ invoices }: { invoices: any[] }) {
  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Invoice Number
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Client
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Total Amount
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {invoice.clientInfo.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    ${invoice.totalAmount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        invoice.paymentDetails.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.paymentDetails.status === "Overdue"
                          ? "bg-red-100 text-red-800"
                          : invoice.paymentDetails.status === "Partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {invoice.paymentDetails.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

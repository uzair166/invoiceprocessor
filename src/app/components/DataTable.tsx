// src/app/components/DataTable.tsx
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
  ICellRendererParams,
  StatusPanelDef,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

// Custom styles for AG Grid
const gridStyles = `
  .ag-theme-alpine .ag-header-cell {
    padding: 0 8px !important;
    height: 30px !important;
    line-height: 30px !important;
    border-right: 2px solid #c8ccd4 !important;
  }
  .ag-theme-alpine .ag-header-cell:nth-child(odd) {
    background-color: #f3f4f6 !important;
  }
  .ag-theme-alpine .ag-header-cell:nth-child(even) {
    background-color: #e5e7eb !important;
  }
  .ag-theme-alpine .ag-header-cell-text {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }
  .ag-theme-alpine .ag-header {
    border-bottom: 2px solid #9ca3af !important;
    height: 30px !important;
    min-height: 30px !important;
    max-height: 30px !important;
  }
  .ag-theme-alpine .ag-header-row {
    height: 30px !important;
    min-height: 30px !important;
    max-height: 30px !important;
  }
  .ag-theme-alpine .ag-header-row-column {
    height: 30px !important;
    min-height: 30px !important;
    max-height: 30px !important;
  }
  .ag-theme-alpine .ag-header-viewport {
    height: 30px !important;
    min-height: 30px !important;
    max-height: 30px !important;
  }
`;

// Suppress AG Grid license errors
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.("AG Grid") ||
    args[0]?.includes?.("License") ||
    args[0]?.includes?.("license") ||
    args[0]?.includes?.("************")
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Define the invoice data type
interface Invoice {
  _id: string;
  invoiceNumber: string;
  companyFrom: string;
  invoiceDate: string;
  grossTotal: number;
  vatTotal: number;
  netTotal: number;
  items: Array<{
    itemCode: string;
    description: string;
    quantity: number;
    unit: string;
    pricePerItem: number;
    grossTotal: number;
    vatAmount: number;
    netTotal: number;
  }>;
}

interface FlattenedInvoiceRow {
  _id: string;
  invoiceNumber: string;
  companyFrom: string;
  invoiceDate: string;
  invoiceGrossTotal: number;
  invoiceVatTotal: number;
  invoiceNetTotal: number;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  pricePerItem: number;
  itemGrossTotal: number;
  itemVatAmount: number;
  itemNetTotal: number;
  isTotal: boolean;
}

export function DataTable({
  data,
  fetchData,
  isLoading,
}: {
  data: Invoice[];
  fetchData: () => Promise<void>;
  isLoading: boolean;
}) {
  const [rowData, setRowData] = useState<FlattenedInvoiceRow[]>([]);

  // Transform invoice data into flattened rows
  useEffect(() => {
    const flattenedRows: FlattenedInvoiceRow[] = [];

    data.forEach((invoice) => {
      // Add individual item rows
      invoice.items.forEach((item) => {
        flattenedRows.push({
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          companyFrom: invoice.companyFrom,
          invoiceDate: invoice.invoiceDate,
          invoiceGrossTotal: invoice.grossTotal,
          invoiceVatTotal: invoice.vatTotal,
          invoiceNetTotal: invoice.netTotal,
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          pricePerItem: item.pricePerItem,
          itemGrossTotal: item.grossTotal,
          itemVatAmount: item.vatAmount,
          itemNetTotal: item.netTotal,
          isTotal: false,
        });
      });

      // Add total row
      flattenedRows.push({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        companyFrom: invoice.companyFrom,
        invoiceDate: invoice.invoiceDate,
        invoiceGrossTotal: invoice.grossTotal,
        invoiceVatTotal: invoice.vatTotal,
        invoiceNetTotal: invoice.netTotal,
        itemCode: "",
        description: "TOTAL FOR INVOICE",
        quantity: 0,
        unit: "",
        pricePerItem: 0,
        itemGrossTotal: invoice.grossTotal,
        itemVatAmount: invoice.vatTotal,
        itemNetTotal: invoice.netTotal,
        isTotal: true,
      });
    });

    setRowData(flattenedRows);
  }, [data]);

  const columnDefs = [
    // Invoice Level Information
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      width: 130,
      pinned: "left",
    },
    {
      field: "companyFrom",
      headerName: "Company",
      width: 150,
    },
    {
      field: "invoiceDate",
      headerName: "Date",
      width: 120,
      valueFormatter: (params: any) =>
        params.value ? format(new Date(params.value), "dd/MM/yyyy") : "",
    },

    // Item Level Information
    {
      field: "itemCode",
      headerName: "Item Code",
      width: 120,
    },
    {
      field: "description",
      headerName: "Description",
      width: 200,
      cellStyle: (params: any) => {
        if (params.data.isTotal) {
          return {
            fontWeight: "bold",
            backgroundColor: "#f0f8ff",
            color: "#2563eb",
          };
        }
        return null;
      },
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 90,
      type: "numericColumn",
    },
    {
      field: "unit",
      headerName: "Unit",
      width: 90,
    },
    {
      field: "pricePerItem",
      headerName: "Price/Item",
      width: 120,
      type: "numericColumn",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },

    // Item Totals
    {
      field: "itemGrossTotal",
      headerName: "Item Gross",
      width: 120,
      type: "numericColumn",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },
    {
      field: "itemVatAmount",
      headerName: "Item VAT",
      width: 120,
      type: "numericColumn",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },
    {
      field: "itemNetTotal",
      headerName: "Item Net",
      width: 120,
      type: "numericColumn",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMenu: true,
    floatingFilter: false,
  };

  const onGridReady = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>View and manage invoice details</CardDescription>
      </CardHeader>
      <CardContent>
        <style>{gridStyles}</style>
        <div className="ag-theme-alpine w-full h-[600px]">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={15}
            rowSelection="multiple"
            onGridReady={onGridReady}
            overlayLoadingTemplate={
              '<span class="ag-overlay-loading-center">Loading invoices...</span>'
            }
            overlayNoRowsTemplate={
              '<span class="ag-overlay-no-rows-center">No invoices found</span>'
            }
            sideBar={{
              toolPanels: [
                {
                  id: "columns",
                  labelDefault: "Columns",
                  labelKey: "columns",
                  iconKey: "columns",
                  toolPanel: "agColumnsToolPanel",
                },
              ],
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

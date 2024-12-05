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
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  clientInfo: {
    name: string;
    contactPerson: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    email: string;
    phone: string;
  };
  businessInfo: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    email: string;
    phone: string;
    taxId: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentDetails: {
    method: string;
    status: string;
    paymentDate: string;
    transactionReference: string;
    balanceDue: number;
  };
  pdfUrl: string;
  createdAt: string;
  lastUpdated: string;
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
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true,
      enableValue: true,
      minWidth: 150,
      suppressSizeToFit: false,
      cellStyle: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
      },
    }),
    []
  );

  const statusBarComponent = useMemo<StatusPanelDef[]>(
    () => [
      { statusPanel: "agTotalAndFilteredRowCountComponent", align: "left" },
      { statusPanel: "agTotalRowCountComponent", align: "center" },
      { statusPanel: "agFilteredRowCountComponent" },
      { statusPanel: "agSelectedRowCountComponent" },
      { statusPanel: "agAggregationComponent" },
    ],
    []
  );

  const columnDefs = useMemo<ColDef<Invoice>[]>(
    () => [
      {
        field: "invoiceNumber",
        headerName: "Invoice #",
        pinned: "left",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        filter: "agTextColumnFilter",
        filterParams: { defaultOption: "contains" },
        minWidth: 130,
      },
      {
        field: "paymentDetails.status",
        headerName: "Status",
        cellRenderer: (params: ICellRendererParams<Invoice>) => {
          const status = params.value || "Unpaid";
          return (
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status === "Paid"
                  ? "bg-green-100 text-green-800"
                  : status === "Overdue"
                  ? "bg-red-100 text-red-800"
                  : status === "Partial"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status}
            </div>
          );
        },
        filter: "agTextColumnFilter",
        minWidth: 120,
      },
      {
        field: "totalAmount",
        headerName: "Total Amount",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(params.value)
            : "-",
        filter: "agNumberColumnFilter",
        aggFunc: "sum",
        minWidth: 120,
      },
      {
        field: "paymentDetails.balanceDue",
        headerName: "Balance Due",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(params.value)
            : "-",
        filter: "agNumberColumnFilter",
        aggFunc: "sum",
        minWidth: 120,
      },
      {
        field: "clientInfo.name",
        headerName: "Client Name",
        filter: "agTextColumnFilter",
        minWidth: 200,
      },
      {
        field: "invoiceDate",
        headerName: "Date",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value ? format(new Date(params.value), "MMM dd, yyyy") : "-",
        filter: "agDateColumnFilter",
        filterParams: {
          comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
            const cellDate = new Date(cellValue);
            if (cellDate < filterLocalDateAtMidnight) return -1;
            if (cellDate > filterLocalDateAtMidnight) return 1;
            return 0;
          },
        },
        minWidth: 120,
      },
      {
        field: "dueDate",
        headerName: "Due Date",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value ? format(new Date(params.value), "MMM dd, yyyy") : "-",
        filter: "agDateColumnFilter",
        minWidth: 120,
      },
      {
        field: "paymentDetails.method",
        headerName: "Payment Method",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
      {
        field: "paymentDetails.paymentDate",
        headerName: "Payment Date",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value ? format(new Date(params.value), "MMM dd, yyyy") : "-",
        filter: "agDateColumnFilter",
        minWidth: 120,
      },
      {
        field: "paymentDetails.transactionReference",
        headerName: "Transaction Ref",
        filter: "agTextColumnFilter",
        minWidth: 150,
      },
      {
        field: "subtotal",
        headerName: "Subtotal",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(params.value)
            : "-",
        filter: "agNumberColumnFilter",
        aggFunc: "sum",
        minWidth: 120,
      },
      {
        field: "discount",
        headerName: "Discount",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(params.value)
            : "-",
        filter: "agNumberColumnFilter",
        aggFunc: "sum",
        minWidth: 120,
      },
      {
        field: "taxRate",
        headerName: "Tax Rate",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value ? `${params.value}%` : "-",
        filter: "agNumberColumnFilter",
        minWidth: 100,
      },
      {
        field: "taxAmount",
        headerName: "Tax Amount",
        valueFormatter: (params: ValueFormatterParams<Invoice>) =>
          params.value
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(params.value)
            : "-",
        filter: "agNumberColumnFilter",
        aggFunc: "sum",
        minWidth: 120,
      },
      {
        field: "clientInfo.contactPerson",
        headerName: "Contact Person",
        filter: "agTextColumnFilter",
        minWidth: 160,
      },
      {
        field: "clientInfo.email",
        headerName: "Client Email",
        filter: "agTextColumnFilter",
        minWidth: 200,
      },
      {
        field: "clientInfo.phone",
        headerName: "Client Phone",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
      {
        field: "paymentTerms",
        headerName: "Payment Terms",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
      {
        field: "clientInfo.address.street",
        headerName: "Client Street",
        filter: "agTextColumnFilter",
        minWidth: 200,
      },
      {
        field: "clientInfo.address.city",
        headerName: "Client City",
        filter: "agTextColumnFilter",
        minWidth: 150,
      },
      {
        field: "clientInfo.address.state",
        headerName: "Client State",
        filter: "agTextColumnFilter",
        minWidth: 120,
      },
      {
        field: "clientInfo.address.zip",
        headerName: "Client ZIP",
        filter: "agTextColumnFilter",
        minWidth: 100,
      },
      {
        field: "clientInfo.address.country",
        headerName: "Client Country",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
      {
        field: "businessInfo.name",
        headerName: "Business Name",
        filter: "agTextColumnFilter",
        minWidth: 200,
      },
      {
        field: "businessInfo.email",
        headerName: "Business Email",
        filter: "agTextColumnFilter",
        minWidth: 200,
      },
      {
        field: "businessInfo.phone",
        headerName: "Business Phone",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
      {
        field: "businessInfo.taxId",
        headerName: "Tax ID",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
      {
        field: "businessInfo.address.street",
        headerName: "Business Street",
        filter: "agTextColumnFilter",
        minWidth: 200,
      },
      {
        field: "businessInfo.address.city",
        headerName: "Business City",
        filter: "agTextColumnFilter",
        minWidth: 150,
      },
      {
        field: "businessInfo.address.state",
        headerName: "Business State",
        filter: "agTextColumnFilter",
        minWidth: 120,
      },
      {
        field: "businessInfo.address.zip",
        headerName: "Business ZIP",
        filter: "agTextColumnFilter",
        minWidth: 100,
      },
      {
        field: "businessInfo.address.country",
        headerName: "Business Country",
        filter: "agTextColumnFilter",
        minWidth: 140,
      },
    ],
    []
  );

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      try {
        setGridApi(params.api);
        params.api.sizeColumnsToFit();
        // Fetch data when grid is ready
        fetchData();
      } catch (error) {
        console.error("Error initializing grid:", error);
        toast.error("Error initializing grid");
      }
    },
    [fetchData]
  );

  const onFirstDataRendered = useCallback(() => {
    try {
      if (gridApi) {
        gridApi.sizeColumnsToFit();
      }
    } catch (error) {
      console.error("Error sizing columns:", error);
      toast.error("Error sizing columns");
    }
  }, [gridApi]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Manage and track your invoices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ag-theme-alpine w-full h-[600px]">
          <AgGridReact
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            enableCellTextSelection={true}
            rowSelection="multiple"
            onGridReady={onGridReady}
            onFirstDataRendered={onFirstDataRendered}
            statusBar={statusBarComponent}
            loadingOverlayComponent={"Loading..."}
            loadingOverlayComponentParams={{
              loadingMessage: "Loading invoices...",
            }}
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
                {
                  id: "filters",
                  labelDefault: "Filters",
                  labelKey: "filters",
                  iconKey: "filter",
                  toolPanel: "agFiltersToolPanel",
                },
              ],
              defaultToolPanel: "columns",
              position: "right",
            }}
            suppressMenuHide={true}
            enableRangeSelection={true}
            enableCharts={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}

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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FileUpload from "./FileUpload";

// Custom styles for AG Grid
const gridStyles = `.ag-theme-alpine .ag-header-cell {
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

interface DeleteCellProps extends ICellRendererParams {
  onDelete: (id: string) => void;
}

const DeleteCell = ({ data, onDelete }: DeleteCellProps) => {
  if (!data.isTotal) return null;

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(data._id);
      }}
    >
      Delete
    </Button>
  );
};

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Transform invoice data into flattened rows
  useEffect(() => {
    const flattenedRows: FlattenedInvoiceRow[] = [];

    data.forEach((invoice) => {
      // Add total row first
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

      // Add separator row
      flattenedRows.push({
        _id: "",
        invoiceNumber: "",
        companyFrom: "",
        invoiceDate: "",
        invoiceGrossTotal: 0,
        invoiceVatTotal: 0,
        invoiceNetTotal: 0,
        itemCode: "",
        description: "",
        quantity: 0,
        unit: "",
        pricePerItem: 0,
        itemGrossTotal: 0,
        itemVatAmount: 0,
        itemNetTotal: 0,
        isTotal: false,
      });
    });

    setRowData(flattenedRows);
  }, [data]);

  const handleDelete = useCallback(async (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!invoiceToDelete) return;

    try {
      const response = await fetch(`/api/invoices?id=${invoiceToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete invoice");
      }

      await fetchData();
      toast.success("Invoice deleted successfully");
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error(error.message || "Failed to delete invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, fetchData]);

  const columnDefs = [
    // Invoice Level Information
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      width: 130,
      pinned: "left",
      filter: "agTextColumnFilter",
      filterParams: {
        filterOptions: ["contains", "equals", "startsWith", "endsWith"],
        defaultOption: "contains",
      },
    },
    {
      field: "companyFrom",
      headerName: "Company",
      width: 150,
      filter: "agTextColumnFilter",
      filterParams: {
        filterOptions: ["contains", "equals", "startsWith", "endsWith"],
        defaultOption: "contains",
      },
    },
    {
      field: "invoiceDate",
      headerName: "Date",
      width: 120,
      filter: "agDateColumnFilter",
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          const cellDate = new Date(cellValue);
          if (cellDate < filterLocalDateAtMidnight) {
            return -1;
          } else if (cellDate > filterLocalDateAtMidnight) {
            return 1;
          }
          return 0;
        },
      },
      valueFormatter: (params: any) =>
        params.value ? format(new Date(params.value), "dd/MM/yyyy") : "",
    },

    // Item Level Information
    {
      field: "itemCode",
      headerName: "Item Code",
      width: 120,
      filter: "agTextColumnFilter",
      filterParams: {
        filterOptions: ["contains", "equals", "startsWith", "endsWith"],
        defaultOption: "contains",
      },
    },
    {
      field: "description",
      headerName: "Description",
      width: 200,
      filter: "agTextColumnFilter",
      filterParams: {
        filterOptions: ["contains", "equals", "startsWith", "endsWith"],
        defaultOption: "contains",
      },
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
      filter: "agNumberColumnFilter",
      valueFormatter: (params: any) => {
        if (params.data.isTotal) return "";
        return params.value || "";
      },
    },
    {
      field: "unit",
      headerName: "Unit",
      width: 90,
      filter: "agTextColumnFilter",
      filterParams: {
        filterOptions: ["contains", "equals", "startsWith", "endsWith"],
        defaultOption: "equals",
      },
    },
    {
      field: "pricePerItem",
      headerName: "Price/Item",
      width: 120,
      type: "numericColumn",
      filter: "agNumberColumnFilter",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },

    // Item Totals
    {
      field: "itemGrossTotal",
      headerName: "Item Gross",
      width: 120,
      type: "numericColumn",
      filter: "agNumberColumnFilter",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },
    {
      field: "itemVatAmount",
      headerName: "Item VAT",
      width: 120,
      type: "numericColumn",
      filter: "agNumberColumnFilter",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },
    {
      field: "itemNetTotal",
      headerName: "Item Net",
      width: 120,
      type: "numericColumn",
      filter: "agNumberColumnFilter",
      valueFormatter: (params: any) =>
        params.value ? `£${params.value.toFixed(2)}` : "",
    },
    {
      headerName: "",
      field: "actions",
      width: 100,
      cellRenderer: DeleteCell,
      cellRendererParams: {
        onDelete: handleDelete,
      },
      sortable: false,
      filter: false,
      pinned: "right",
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

  // Add row styling based on row type
  const getRowStyle = (params: any) => {
    if (params.data.isTotal) {
      return {
        fontWeight: "bold",
        backgroundColor: "#f0f8ff",
        borderBottom: "2px solid #e5e7eb",
      };
    }
    // Empty separator row style
    if (!params.data.invoiceNumber && !params.data.description) {
      return {
        backgroundColor: "#f9fafb",
        height: "20px",
        borderBottom: "1px solid #e5e7eb",
      };
    }
    return null;
  };

  return (
    <Card className="h-[calc(100vh-4rem)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and manage invoice details</CardDescription>
        </div>
        <FileUpload onUploadSuccess={fetchData} />
      </CardHeader>
      <CardContent>
        <style>{gridStyles}</style>
        <div className="ag-theme-alpine w-full h-[calc(100vh-12rem)]">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={false}
            rowSelection="multiple"
            onGridReady={onGridReady}
            getRowStyle={getRowStyle}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              invoice and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

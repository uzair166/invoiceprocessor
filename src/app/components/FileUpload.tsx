"use client";

import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileUpload({
  onUploadSuccess,
}: {
  onUploadSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.success) {
        const invoiceCount = data.invoices?.length || 0;
        toast.success(
          invoiceCount === 1
            ? "Invoice processed successfully"
            : `${invoiceCount} invoices processed successfully`
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onUploadSuccess();
      } else {
        throw new Error(data.error || "Failed to process invoice(s)");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Error processing invoice(s)"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Processing..." : "Upload Invoice"}
      </Button>
    </div>
  );
}

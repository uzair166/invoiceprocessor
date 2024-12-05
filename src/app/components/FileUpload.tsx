"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileUpload({
  onUploadSuccess,
}: {
  onUploadSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("Please upload a PDF file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Invoice processed successfully");
      setSelectedFile(null);
      onUploadSuccess();
    } catch (error) {
      toast.error("Error processing invoice");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }
          ${selectedFile ? "bg-gray-50" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          {selectedFile ? (
            <div className="flex items-center space-x-2">
              <File className="h-8 w-8 text-blue-500" />
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="text-gray-600">
                {isDragActive ? (
                  <p>Drop the PDF file here</p>
                ) : (
                  <p>Drag & drop a PDF file here, or click to select</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Only PDF files are accepted
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!selectedFile || uploading}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Processing..." : "Process Invoice"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import React, { useState, useRef, useCallback } from "react";
import { useJsonStore } from "@/stores/jsonStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JsonEditor } from "@/components/ui/json-editor";
import { ArrowRight, Code2, FileJson, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type IdlInputMethod = "editor" | "upload";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface IdlConfigurationStepProps {
  onNext: () => void;
}

export default function IdlConfigurationStep({
  onNext,
}: IdlConfigurationStepProps) {
  const [inputMethod, setInputMethod] = useState<IdlInputMethod>("editor");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isValid, setJsonData } = useJsonStore();

  const validateAndProcessJsonFile = useCallback(
    (file: File) => {
      if (!file) return;

      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        toast.error("Invalid file type", {
          description: "Please upload a valid JSON file.",
          duration: 3000,
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error("File size exceeds limit", {
          description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
          duration: 5000,
        });
        return;
      }

      const reader = new FileReader();
      toast.loading("Processing JSON file...", { id: "process-json" });

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsedJson = JSON.parse(content);

          console.log("Parsed IDL:", parsedJson);

          setJsonData(content);
          setInputMethod("editor");

          toast.success("IDL file loaded successfully", {
            id: "process-json",
            description: `File: ${file.name}`,
            duration: 3000,
          });
        } catch (error) {
          toast.error("Invalid JSON format", {
            id: "process-json",
            description:
              error instanceof Error
                ? error.message
                : "The file contains malformed JSON.",
            duration: 4000,
          });
        }
      };

      reader.onerror = () => {
        toast.error("File read error", {
          id: "process-json",
          description: "Unable to read the file. Please try again.",
          duration: 4000,
        });
      };

      reader.readAsText(file);
    },
    [setJsonData]
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        validateAndProcessJsonFile(file);
      }
      if (event.target) {
        event.target.value = "";
      }
    },
    [validateAndProcessJsonFile]
  );

  const handleFileDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        validateAndProcessJsonFile(file);
      }
    },
    [validateAndProcessJsonFile]
  );

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const triggerFileInput = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full w-full flex-col"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          Program IDL Configuration
        </h2>
        <p className="text-muted-foreground">
          Provide your Anchor program Interface Definition Language file
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex mb-4"
      >
        <div className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-muted p-1">
          <button
            onClick={() => setInputMethod("editor")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              inputMethod === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Code2 className="mr-2 h-4 w-4" />
            JSON Editor
          </button>
          <button
            onClick={() => setInputMethod("upload")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              inputMethod === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex-1 min-h-0 h-full w-full flex"
      >
        <AnimatePresence mode="wait">
          {inputMethod === "editor" ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 rounded-lg border bg-card/50 shadow-sm"
            >
              <div className="border-b bg-muted/30 px-6 py-4">
                <h3 className="text-lg font-medium">Edit IDL JSON</h3>
                <p className="text-sm text-muted-foreground">
                  Paste or modify your Anchor program IDL directly below
                </p>
              </div>

              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <JsonEditor />
              </div>

              <div className="border-t bg-muted/30 px-4 py-2 flex justify-end">
                <div className="text-xs text-muted-foreground">
                  Use the Format button to beautify your JSON
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card/50 shadow-sm h-full"
            >
              <div className="border-b bg-muted/30 px-6 py-4">
                <h3 className="text-lg font-medium">Upload IDL File</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your Anchor program IDL JSON file to begin
                </p>
              </div>
              <div className="p-6 flex-1">
                <motion.div
                  animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-12 transition-colors cursor-pointer ${
                    isDragActive
                      ? "border-primary/50 bg-primary/20"
                      : "border-primary/20 bg-primary/5 hover:border-primary/30 hover:bg-primary/10"
                  }`}
                  onClick={triggerFileInput}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileDrop}
                >
                  <input
                    type="file"
                    id="idl-file-input"
                    accept=".json,application/json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                  />
                  <motion.div 
                    animate={{ 
                      y: isDragActive ? -5 : 0,
                      scale: isDragActive ? 1.1 : 1 
                    }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 rounded-full bg-primary/10 p-3"
                  >
                    <FileJson className="h-8 w-8 text-primary" />
                  </motion.div>
                  <div className="mb-2 text-xl font-medium">
                    Drop your IDL file here or click to browse
                  </div>
                  <div className="mb-6 text-sm text-muted-foreground">
                    Supports .json files up to {MAX_FILE_SIZE_MB}MB
                  </div>
                  <Button variant="outline" className="gap-2 pointer-events-none">
                    <Upload className="h-4 w-4" />
                    Select JSON File
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex justify-end"
      >
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
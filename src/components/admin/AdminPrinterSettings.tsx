"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, FileText, Printer, RefreshCw, Settings2 } from "lucide-react";
import {
  getPrinterInfos,
  getSelectedDymoPrinter,
  loadDymoFramework,
  printLabel,
  renderTestLabelPreview,
  setSelectedDymoPrinter,
  type DymoPrinterInfo,
} from "../../lib/dymo";

type ServiceStatus = "checking" | "ready" | "error";

export default function AdminPrinterSettings() {
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [printers, setPrinters] = useState<DymoPrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testStatus, setTestStatus] = useState<"confirmed" | "submitted" | "">("");
  const [preview, setPreview] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const refreshPrinters = useCallback(async () => {
    setStatus("checking");
    setError("");
    setTestMessage("");
    setTestStatus("");
    setPreview("");

    try {
      await loadDymoFramework();
      const detectedPrinters = await getPrinterInfos();
      const connected = detectedPrinters.filter((p) => p.isConnected);
      const savedPrinter = getSelectedDymoPrinter();
      const nextPrinter = connected.find((p) => p.name === savedPrinter)?.name || connected[0]?.name || "";

      setPrinters(detectedPrinters);
      setSelectedPrinter(nextPrinter);
      setSelectedDymoPrinter(nextPrinter);
      setStatus("ready");
    } catch (refreshError) {
      setPrinters([]);
      setStatus("error");
      setError(refreshError instanceof Error ? refreshError.message : "Unable to connect to DYMO Connect.");
    }
  }, []);

  useEffect(() => {
    void refreshPrinters();
  }, [refreshPrinters]);

  const selectPrinter = (printerName: string) => {
    setSelectedPrinter(printerName);
    setSelectedDymoPrinter(printerName);
    setTestMessage("");
    setTestStatus("");
    setPreview("");
  };

  const printTestLabel = async () => {
    if (!selectedPrinter) return;

    setTesting(true);
    setTestMessage("");
    setTestStatus("");
    setError("");

    try {
      const result = await printLabel({
        printerName: selectedPrinter,
        orderId: "TEST",
        customerName: "All Remotes",
        customerEmail: "",
        customerPhone: "",
        address: "Printer test successful",
        suburb: "",
        state: "",
        postcode: "",
        items: [],
        template: {
          id: "printer-test",
          name: "Printer Test",
          layout: { width: 252, height: 79 },
          fields: [
            { id: "test_heading", type: "text", label: "Heading", dataKey: "customerName", x: 8, y: 12, fontSize: 16, fontWeight: "bold" },
            { id: "test_message", type: "text", label: "Message", dataKey: "address", x: 8, y: 36, fontSize: 11, fontWeight: "normal" },
          ],
        },
      });
      setTestMessage(result.message);
      setTestStatus(result.status);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Test print failed.");
    } finally {
      setTesting(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedPrinter) return;
    setPreviewing(true);
    setPreview("");
    try {
      const dataUri = await renderTestLabelPreview(selectedPrinter);
      setPreview(dataUri);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Failed to generate preview.");
    } finally {
      setPreviewing(false);
    }
  };

  const serviceReady = status === "ready";
  const hasPrinters = printers.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Printer Setup</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Connect this workstation to DYMO Connect, choose its default LabelWriter, and run a test print.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshPrinters()}
          disabled={status === "checking" || testing}
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={status === "checking" ? "animate-spin" : ""} />
          Refresh devices
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {serviceReady ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className={status === "error" ? "text-red-600" : "text-amber-600"} />}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">DYMO service</p>
              <p className="mt-1 font-semibold text-neutral-900">{status === "checking" ? "Checking" : serviceReady ? "Connected" : "Unavailable"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Printer size={20} className="text-blue-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Detected printers</p>
              <p className="mt-1 font-semibold text-neutral-900">{status === "checking" ? "Checking" : printers.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Settings2 size={20} className="text-blue-600" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Default printer</p>
              <p className="mt-1 truncate font-semibold text-neutral-900">{selectedPrinter || "Not selected"}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Printer setup needs attention</p>
            <p className="mt-1 leading-6">{error}</p>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-neutral-900">Default printer for this computer</h2>
          <p className="mt-1 text-sm text-neutral-600">The selection is stored in this browser and used by the Print Label button on orders.</p>
        </div>
        <div className="p-6">
          {status === "checking" ? (
            <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />
          ) : hasPrinters ? (
            <div className="space-y-3">
              {printers.map((printer) => {
                const selected = selectedPrinter === printer.name;
                const dim = !printer.isConnected;
                return (
                  <label key={printer.name} className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-neutral-200 hover:bg-neutral-50"} ${dim ? "opacity-50" : ""}`}>
                    <input
                      type="radio"
                      name="default-dymo-printer"
                      value={printer.name}
                      checked={selected}
                      onChange={() => selectPrinter(printer.name)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <Printer size={20} className={selected ? "text-blue-600" : "text-neutral-500"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-neutral-900">{printer.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {printer.modelName}{printer.isLocal ? " · USB" : " · LAN"}{!printer.isConnected && " · Offline"}
                      </p>
                    </div>
                    {selected && <span className="text-xs font-semibold text-blue-700">Default</span>}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
              <Printer size={32} className="mx-auto text-neutral-400" />
              <h3 className="mt-3 font-semibold text-neutral-900">No DYMO printers detected</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-600">Open DYMO Connect, connect and power on the printer, then refresh devices.</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Test printing</h2>
            <p className="mt-1 text-sm text-neutral-600">Prints one DYMO 99010 Standard Address label (89 mm x 28 mm).</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void generatePreview()}
              disabled={!serviceReady || !selectedPrinter || previewing}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye size={16} />
              {previewing ? "Generating" : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => void printTestLabel()}
              disabled={!serviceReady || !selectedPrinter || testing}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={16} />
              {testing ? "Sending test" : "Print test label"}
            </button>
          </div>
        </div>
        {preview && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Label preview</p>
            <img
              src={preview}
              alt="Label preview"
              className="rounded-lg border border-neutral-200 bg-white shadow-sm"
              style={{ maxHeight: 200, width: "auto" }}
            />
          </div>
        )}
        {testMessage && (
          <p role="status" className={`mt-4 flex items-center gap-2 text-sm font-medium ${testStatus === "confirmed" ? "text-emerald-700" : "text-amber-700"}`}>
            {testStatus === "confirmed" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            {testMessage}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <FileText size={20} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <h2 className="font-semibold text-neutral-900">Label templates</h2>
            <p className="mt-1 text-sm text-neutral-600">Manage label fields, typography, and layout separately.</p>
          </div>
        </div>
        <Link href="/admin?tab=labels" className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 active:translate-y-px">
          Manage templates
        </Link>
      </section>
    </div>
  );
}

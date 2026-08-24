"use client";

import { useState, useRef, useEffect } from "react";
import { SAMPLE_CONTRACT } from "@/lib/sampleContract";
import { extractContractIdFromUrl, getContractWasmSize } from "@/lib/stellar";
import { NETWORKS } from "@/types/stellar";

const MAX_CHARS = 500_000;

type InputMode = "code" | "github" | "contractId" | "batch";

interface Props {
  onScan: (
    source: string,
    mode: InputMode,
    options?: { networks?: string[] },
  ) => void;
  onBatchScan?: (
    sources: string[],
    options?: { networks?: string[] },
  ) => void;
  loading: boolean;
  countdown?: number;
  initialValue?: string;
  initialMode?: InputMode;
  error?: string | null;
  isTimeout?: boolean;
  onRetry?: () => void;
}

function validateGithub(url: string): { valid: boolean; error?: string } {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com")
      return { valid: false, error: "Must be a github.com URL" };
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length < 2 || !parts[0] || !parts[1])
      return { valid: false, error: "Invalid repository path — expected github.com/owner/repo" };
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

function detectMode(value: string): InputMode {
  if (value.startsWith("https://github.com")) return "github";
  if (value.startsWith("C") && value.length >= 56) return "contractId";
  return "code";
}

const MODES: { id: InputMode; label: string }[] = [
  { id: "code", label: "Paste code" },
  { id: "github", label: "GitHub URL" },
  { id: "contractId", label: "Contract ID" },
  { id: "batch", label: "Batch Scan" },
];

export default function ScanInput({
  onScan,
  onBatchScan,
  loading,
  countdown = 0,
  initialValue = "",
  initialMode,
  error,
  isTimeout,
  onRetry,
}: Props) {
  const resolvedInitialMode = initialMode ?? detectMode(initialValue);

  const [mode, setMode] = useState<InputMode>(resolvedInitialMode);
  const [code, setCode] = useState(
    resolvedInitialMode === "code" ? initialValue : "",
  );
  const [repoUrl, setRepoUrl] = useState(
    resolvedInitialMode === "github" ? initialValue : "",
  );
  const [contractId, setContractId] = useState(
    resolvedInitialMode === "contractId" ? initialValue : "",
  );
  const [batchText, setBatchText] = useState(
    resolvedInitialMode === "batch" ? initialValue : "",
  );

  const [normalized, setNormalized] = useState(false);
  const [extractedFromUrl, setExtractedFromUrl] = useState(false);
  const [wasmSize, setWasmSize] = useState<number | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([
    NETWORKS.testnet.name,
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const normalizedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contractValid = contractId.length >= 56 && contractId.startsWith("C");
  const repoValidation = validateGithub(repoUrl);
  const repoError =
    repoUrl.length > 0 && !repoValidation.valid
      ? repoValidation.error
      : undefined;

  const parsedBatchSources = batchText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!contractValid) {
      setWasmSize(null);
      return;
    }
    const networkName = selectedNetworks[0] ?? NETWORKS.testnet.name;
    const network = NETWORKS[networkName] ?? NETWORKS.testnet;
    getContractWasmSize(contractId, network).then(setWasmSize);
  }, [contractId, contractValid, selectedNetworks]);

  useEffect(
    () => () => {
      if (normalizedTimer.current) clearTimeout(normalizedTimer.current);
    },
    [],
  );

  function handleContractIdChange(raw: string) {
    setExtractedFromUrl(false);
    const extracted = extractContractIdFromUrl(raw);
    if (extracted) {
      setContractId(extracted);
      setExtractedFromUrl(true);
      return;
    }
    const clean = raw.trim().toUpperCase();
    setContractId(clean);
    if (clean !== raw) {
      if (normalizedTimer.current) clearTimeout(normalizedTimer.current);
      setNormalized(true);
      normalizedTimer.current = setTimeout(() => setNormalized(false), 1000);
    }
  }

  function toggleNetwork(name: string) {
    setSelectedNetworks((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  const isRateLimited = countdown > 0;

  const canSubmit =
    !loading &&
    !isRateLimited &&
    (mode === "code"
      ? code.trim().length > 0 && code.length <= MAX_CHARS
      : mode === "github"
        ? repoUrl.trim().length > 0 && repoValidation.valid
        : mode === "contractId"
          ? contractId.trim().length > 0 && contractValid
          : parsedBatchSources.length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (mode === "batch") {
      if (onBatchScan) {
        onBatchScan(parsedBatchSources, {
          networks: selectedNetworks.length > 0 ? selectedNetworks : undefined,
        });
      } else {
        onScan(parsedBatchSources.join("\n"), "batch", {
          networks: selectedNetworks.length > 0 ? selectedNetworks : undefined,
        });
      }
      return;
    }

    const source =
      mode === "code"
        ? code.trim()
        : mode === "github"
          ? repoUrl.trim()
          : contractId.trim();
    if (!source) return;

    onScan(source, mode, {
      networks:
        mode === "contractId" && selectedNetworks.length > 0
          ? selectedNetworks
          : undefined,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (canSubmit) handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div aria-label="Scan source" className="mb-4 flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === m.id
                ? "bg-indigo-500/20 text-indigo-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "code" && (
        <div>
          <label htmlFor="scan-code" className="sr-only">
            Contract source code
          </label>
          <textarea
            id="scan-code"
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={14}
            spellCheck={false}
            placeholder="Paste your contract source here…"
            aria-describedby="scan-code-help"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 font-mono text-sm"
          />
          <div
            id="scan-code-help"
            className="mt-1 flex justify-between text-xs text-slate-400"
          >
            <button
              type="button"
              onClick={() => setCode(SAMPLE_CONTRACT)}
              className="underline hover:text-slate-300"
            >
              Load sample contract
            </button>
            <span className={code.length > MAX_CHARS ? "text-red-400" : ""}>
              {code.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {mode === "github" && (
        <div>
          <label htmlFor="scan-repo" className="sr-only">
            GitHub repository URL
          </label>
          <input
            id="scan-repo"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://github.com/org/repo"
            aria-invalid={Boolean(repoError)}
            aria-describedby={repoError ? "scan-repo-error" : undefined}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm"
          />
          {repoError && (
            <p id="scan-repo-error" role="alert" className="mt-1 text-xs text-red-400">
              {repoError}
            </p>
          )}
        </div>
      )}

      {mode === "contractId" && (
        <div>
          <label htmlFor="scan-contract" className="sr-only">
            Stellar contract ID
          </label>
          <input
            id="scan-contract"
            type="text"
            value={contractId}
            onChange={(e) => handleContractIdChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="CAAAA…"
            spellCheck={false}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 font-mono text-sm"
          />
          <div aria-live="polite" className="mt-1 text-xs text-slate-500">
            {extractedFromUrl && <span>Contract ID extracted from URL</span>}
            {normalized && <span>Normalized to uppercase</span>}
            {wasmSize !== null && (
              <span>WASM size: {(wasmSize / 1024).toFixed(1)} KB</span>
            )}
          </div>

          <fieldset className="mt-3">
            <legend className="text-xs uppercase tracking-wide text-slate-500">
              Networks
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {Object.values(NETWORKS).map((network) => (
                <label
                  key={network.name}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedNetworks.includes(network.name)}
                    onChange={() => toggleNetwork(network.name)}
                  />
                  {network.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {mode === "batch" && (
        <div>
          <label htmlFor="scan-batch" className="sr-only">
            Batch contract sources or IDs
          </label>
          <textarea
            id="scan-batch"
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={10}
            spellCheck={false}
            placeholder={`Enter multiple contract IDs or GitHub URLs (one per line)…\n\nExample:\nCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM\nCBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2KM\nhttps://github.com/SorobanGuard/Guard-Contracts`}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 font-mono text-sm text-slate-200"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>
              {parsedBatchSources.length} item
              {parsedBatchSources.length !== 1 ? "s" : ""} queued for batch scan
            </span>
            <span>Concurrency limit: 3</span>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <p>{error}</p>
          {isTimeout && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 underline hover:text-red-200"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Scanning…"
          : isRateLimited
            ? `Rate limited — retry in ${countdown}s`
            : mode === "batch"
              ? `Scan Batch (${parsedBatchSources.length})`
              : "Scan contract"}
      </button>
    </form>
  );
}

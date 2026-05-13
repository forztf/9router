"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Card, SegmentedControl } from "@/shared/components";
import Pagination from "@/shared/components/Pagination";

const PERIODS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "60d", label: "60D" },
];

const PAGE_SIZE = 10;

function fmtTokens(n) {
  if (n === null || n === undefined) return "0";
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function fmtCost(n) {
  return `~$${(n || 0).toFixed(2)}`;
}

function fmtNum(n) {
  return (n || 0).toLocaleString();
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[72px] rounded-[14px] bg-surface border border-border-subtle" />
      ))}
    </div>
  );
}

function SortIcon({ field, sortField, sortOrder }) {
  if (sortField !== field) return <span className="ml-1 opacity-20">↕</span>;
  return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
}

function SummaryCards({ summary }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">Total Requests</span>
        <span className="truncate text-2xl font-bold">{fmtNum(summary.totalRequests)}</span>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">Input Tokens</span>
        <span className="truncate text-2xl font-bold text-primary">{fmtTokens(summary.totalPromptTokens)}</span>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">Output Tokens</span>
        <span className="truncate text-2xl font-bold text-success">{fmtTokens(summary.totalCompletionTokens)}</span>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">Est. Cost</span>
        <span className="truncate text-2xl font-bold text-warning">{fmtCost(summary.totalCost)}</span>
        <span className="text-[10px] text-text-muted">Estimated, not actual billing</span>
      </Card>
    </div>
  );
}

const COLUMNS = [
  { field: "name", label: "API Key Name", align: "left" },
  { field: "requests", label: "Requests", align: "right" },
  { field: "promptTokens", label: "Input Tokens", align: "right" },
  { field: "completionTokens", label: "Output Tokens", align: "right" },
  { field: "cost", label: "Est. Cost", align: "right" },
];

function ApiKeyTable({ keys, summary, sortField, sortOrder, onSort }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-bg-subtle/30 text-text-muted uppercase text-xs">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.field}
                  className={`px-6 py-3 cursor-pointer hover:bg-bg-subtle/50 select-none ${col.align === "right" ? "text-right" : ""}`}
                  onClick={() => onSort(col.field)}
                >
                  {col.label} <SortIcon field={col.field} sortField={sortField} sortOrder={sortOrder} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {keys.map((key, i) => (
              <tr key={key.apiKey || i} className="hover:bg-bg-subtle/20 transition-colors">
                <td className="px-6 py-3 font-medium">
                  {key.name || `${key.apiKey?.slice(0, 8)}...`}
                </td>
                <td className="px-6 py-3 text-right">{fmtNum(key.requests)}</td>
                <td className="px-6 py-3 text-right text-text-muted">{fmtTokens(key.promptTokens)}</td>
                <td className="px-6 py-3 text-right text-text-muted">{fmtTokens(key.completionTokens)}</td>
                <td className="px-6 py-3 text-right font-medium text-warning">{fmtCost(key.cost)}</td>
              </tr>
            ))}
            {keys.length > 0 && summary && (
              <tr className="bg-bg-subtle/30 font-semibold border-t-2 border-border">
                <td className="px-6 py-3">Total</td>
                <td className="px-6 py-3 text-right">{fmtNum(summary.totalRequests)}</td>
                <td className="px-6 py-3 text-right">{fmtTokens(summary.totalPromptTokens)}</td>
                <td className="px-6 py-3 text-right">{fmtTokens(summary.totalCompletionTokens)}</td>
                <td className="px-6 py-3 text-right text-warning">{fmtCost(summary.totalCost)}</td>
              </tr>
            )}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  No API key usage data for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ApiKeyAnalyticsContent() {
  const [period, setPeriod] = useState("7d");
  const [sortField, setSortField] = useState("requests");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage/apikey-stats?period=${period}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setCurrentPage(1);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  const sortedKeys = useMemo(() => {
    if (!data?.keys) return [];
    const arr = [...data.keys];
    arr.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (sortField === "name") {
        va = va || "";
        vb = vb || "";
        return sortOrder === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      va = va || 0;
      vb = vb || 0;
      return sortOrder === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [data?.keys, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedKeys.length / PAGE_SIZE);
  const pagedKeys = sortedKeys.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const summary = data?.summary || {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCost: 0,
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 px-1 sm:px-0">
      {/* Period selector */}
      <div className="flex items-center justify-end">
        <SegmentedControl
          options={PERIODS}
          value={period}
          onChange={setPeriod}
          size="sm"
          className="w-full sm:w-auto"
        />
      </div>

      {/* Summary cards */}
      {loading ? <CardsSkeleton /> : <SummaryCards summary={summary} />}

      {/* Table */}
      {loading ? (
        <Card className="h-[200px] animate-pulse" />
      ) : (
        <>
          <ApiKeyTable
            keys={pagedKeys}
            summary={summary}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={sortedKeys.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}

export default function ApiKeyAnalyticsPage() {
  return (
    <Suspense fallback={<CardsSkeleton />}>
      <ApiKeyAnalyticsContent />
    </Suspense>
  );
}

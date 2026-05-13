"use client";

import { Suspense, useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { Card, SegmentedControl } from "@/shared/components";
import Pagination from "@/shared/components/Pagination";
import { translate } from "@/i18n/runtime";
import { cn } from "@/shared/utils/cn";

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
        <span className="text-text-muted text-sm uppercase font-semibold">{translate("Total Requests")}</span>
        <span className="truncate text-2xl font-bold">{fmtNum(summary.totalRequests)}</span>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">{translate("Input Tokens")}</span>
        <span className="truncate text-2xl font-bold text-primary">{fmtTokens(summary.totalPromptTokens)}</span>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">{translate("Output Tokens")}</span>
        <span className="truncate text-2xl font-bold text-success">{fmtTokens(summary.totalCompletionTokens)}</span>
      </Card>
      <Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-text-muted text-sm uppercase font-semibold">{translate("Est. Cost")}</span>
        <span className="truncate text-2xl font-bold text-warning">{fmtCost(summary.totalCost)}</span>
        <span className="text-[10px] text-text-muted">{translate("Estimated, not actual billing")}</span>
      </Card>
    </div>
  );
}

function BreakdownTable({ data, type }) {
  const entries = Object.entries(data || {})
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.requests - a.requests);

  const topEntries = type === "provider" ? entries : entries.slice(0, 10);

  if (topEntries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-main">
        {type === "provider" ? translate("Top Providers") : translate("Top Models")}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-subtle/30 text-text-muted uppercase">
              <th className="px-3 py-2 text-left">{type === "provider" ? translate("Provider") : translate("Model")}</th>
              <th className="px-3 py-2 text-right">{translate("Requests")}</th>
              <th className="px-3 py-2 text-right">{translate("Input Tokens")}</th>
              <th className="px-3 py-2 text-right">{translate("Output Tokens")}</th>
              <th className="px-3 py-2 text-right">{translate("Est. Cost")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {topEntries.map((entry, i) => (
              <tr key={entry.name} className={i % 2 === 0 ? "bg-bg-subtle/10" : ""}>
                <td className="px-3 py-2 font-medium truncate max-w-[120px]">{entry.name}</td>
                <td className="px-3 py-2 text-right">{fmtNum(entry.requests)}</td>
                <td className="px-3 py-2 text-right text-text-muted">{fmtTokens(entry.promptTokens)}</td>
                <td className="px-3 py-2 text-right text-text-muted">{fmtTokens(entry.completionTokens)}</td>
                <td className="px-3 py-2 text-right font-medium text-warning">{fmtCost(entry.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandedRow({ item }) {
  return (
    <tr className="bg-bg-subtle/10">
      <td colSpan={5} className="px-6 py-4">
        <div className="space-y-4">
          <div className="text-sm font-semibold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            {translate("Usage Breakdown")}: {item.name || `${item.apiKey?.slice(0, 8)}...`}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-3">
              <BreakdownTable data={item.byProvider} type="provider" />
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <BreakdownTable data={item.byModel} type="model" />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

function ApiKeyTable({ keys, summary, sortField, sortOrder, onSort, expandedKey, onToggleExpand }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-bg-subtle/30 text-text-muted uppercase text-xs">
            <tr>
              <th className="px-6 py-3 w-10"></th>
              {[
                { field: "name", label: translate("API Key Name"), align: "left" },
                { field: "requests", label: translate("Requests"), align: "right" },
                { field: "promptTokens", label: translate("Input Tokens"), align: "right" },
                { field: "completionTokens", label: translate("Output Tokens"), align: "right" },
                { field: "cost", label: translate("Est. Cost"), align: "right" },
              ].map((col) => (
                <th
                  key={col.field}
                  className={cn(
                    "px-6 py-3 cursor-pointer hover:bg-bg-subtle/50 select-none",
                    col.align === "right" ? "text-right" : ""
                  )}
                  onClick={() => onSort(col.field)}
                >
                  {col.label} <SortIcon field={col.field} sortField={sortField} sortOrder={sortOrder} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {keys.map((key, i) => (
              <Fragment key={key.apiKey || i}>
                <tr className="hover:bg-bg-subtle/20 transition-colors">
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      onClick={() => onToggleExpand(key.apiKey || i)}
                      className="p-1 hover:bg-bg-subtle/50 rounded transition-colors"
                      title={expandedKey === (key.apiKey || i) ? translate("Collapse") : translate("Expand")}
                    >
                      <span className={cn(
                        "material-symbols-outlined text-[20px] text-text-muted transition-transform duration-200",
                        expandedKey === (key.apiKey || i) ? "rotate-90" : ""
                      )}>
                        chevron_right
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-3 font-medium">
                    {key.name || `${key.apiKey?.slice(0, 8)}...`}
                  </td>
                  <td className="px-6 py-3 text-right">{fmtNum(key.requests)}</td>
                  <td className="px-6 py-3 text-right text-text-muted">{fmtTokens(key.promptTokens)}</td>
                  <td className="px-6 py-3 text-right text-text-muted">{fmtTokens(key.completionTokens)}</td>
                  <td className="px-6 py-3 text-right font-medium text-warning">{fmtCost(key.cost)}</td>
                </tr>
                {expandedKey === (key.apiKey || i) && <ExpandedRow item={key} />}
              </Fragment>
            ))}
            {keys.length > 0 && summary && (
              <tr className="bg-bg-subtle/30 font-semibold border-t-2 border-border">
                <td colSpan={2} className="px-6 py-3">{translate("Total") || "Total"}</td>
                <td className="px-6 py-3 text-right">{fmtNum(summary.totalRequests)}</td>
                <td className="px-6 py-3 text-right">{fmtTokens(summary.totalPromptTokens)}</td>
                <td className="px-6 py-3 text-right">{fmtTokens(summary.totalCompletionTokens)}</td>
                <td className="px-6 py-3 text-right text-warning">{fmtCost(summary.totalCost)}</td>
              </tr>
            )}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  {translate("No API key usage data for this period.")}
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
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage/apikey-stats?period=${period}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setCurrentPage(1);
        setExpandedKey(null);
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

  const handleToggleExpand = useCallback((key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const sortedKeys = useMemo(() => {
    if (!data?.items) return [];
    const arr = [...data.items];
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
  }, [data?.items, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedKeys.length / PAGE_SIZE);
  const pagedKeys = sortedKeys.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const summary = {
    totalRequests: data?.totalRequests || 0,
    totalPromptTokens: data?.totalPromptTokens || 0,
    totalCompletionTokens: data?.totalCompletionTokens || 0,
    totalCost: data?.totalCost || 0,
  };

  const handleExportCSV = useCallback(() => {
    if (!data?.items || data.items.length === 0) return;

    const headers = [
      translate("API Key Name"),
      translate("Requests"),
      translate("Input Tokens"),
      translate("Output Tokens"),
      translate("Est. Cost"),
    ];
    const rows = sortedKeys.map((key) => [
      key.name || `${key.apiKey?.slice(0, 8)}...`,
      key.requests,
      key.promptTokens,
      key.completionTokens,
      key.cost.toFixed(2),
    ]);
    rows.push([
      translate("Total") || "Total",
      summary.totalRequests,
      summary.totalPromptTokens,
      summary.totalCompletionTokens,
      summary.totalCost.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `apikey-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, sortedKeys, summary]);

  const hasData = data?.items && data.items.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-6 px-1 sm:px-0">
      {/* Period selector + Export */}
      <div className="flex items-center justify-between gap-4">
        <div></div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!hasData || loading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              hasData && !loading
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                : "bg-bg-subtle text-text-muted cursor-not-allowed"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {translate("Export CSV")}
          </button>
          <SegmentedControl
            options={PERIODS}
            value={period}
            onChange={setPeriod}
            size="sm"
            className="w-full sm:w-auto"
          />
        </div>
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
            expandedKey={expandedKey}
            onToggleExpand={handleToggleExpand}
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

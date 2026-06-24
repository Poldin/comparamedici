"use client";

import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (newPage: number | ((prev: number) => number)) => void;
  isPending?: boolean;
}

export function TablePagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
  isPending = false,
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border gap-4">
      <div className="text-sm text-slate-500">
        Mostrando da <span className="font-medium">{startRecord}</span> a{" "}
        <span className="font-medium">{endRecord}</span> di{" "}
        <span className="font-medium">{totalCount}</span> record
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((p) => Math.max(p - 1, 1))}
          disabled={page === 1 || isPending}
        >
          Precedente
        </Button>
        <div className="text-sm font-medium px-2">
          Pagina {page} di {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((p) => Math.min(p + 1, totalPages))}
          disabled={page >= totalPages || isPending}
        >
          Successivo
        </Button>
      </div>
    </div>
  );
}
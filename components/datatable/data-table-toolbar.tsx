"use client";

import { DataTableFacetedFilter } from "@/components/datatable/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/datatable/data-table-view-options";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DataTableFilterField } from "@/app/types";
import type { Table } from "@tanstack/react-table";
import { PlusCircle, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

interface DataTableToolbarProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  filterFields?: DataTableFilterField<TData>[];
}

export function DataTableToolbar<TData>({
  table,
  filterFields = [],
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const pathname = usePathname();
  const router = useRouter();

  const handleCreateAction = (type?: string) => {
    if (pathname.includes("/recipes")) {
      router.push("/dashboard/products/recipe/create");
    } else if (pathname.includes("/stock-transfers")) {
      if (type === "start-of-day") {
        router.push("/dashboard/production/stock-transfers/create");
      }
    }
  };

  const isFiltered = table.getState().columnFilters.length > 0;

  const { searchableColumns, filterableColumns } = React.useMemo(() => {
    return {
      searchableColumns: filterFields.filter((field) => !field.options),
      filterableColumns: filterFields.filter((field) => field.options),
    };
  }, [filterFields]);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 overflow-auto p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2">
        {searchableColumns.length > 0 &&
          searchableColumns.map(
            (column) =>
              table.getColumn(column.id ? String(column.id) : "") && (
                <Input
                  key={String(column.id)}
                  placeholder={column.placeholder}
                  value={
                    (table
                      .getColumn(String(column.id))
                      ?.getFilterValue() as string) ?? ""
                  }
                  onChange={(event) => {
                    table
                      .getColumn(String(column.id))
                      ?.setFilterValue(event.target.value);
                  }}
                  className="h-8 w-40 lg:w-64"
                />
              ),
          )}
        {filterableColumns.length > 0 &&
          filterableColumns.map(
            (column) =>
              table.getColumn(column.id ? String(column.id) : "") && (
                <DataTableFacetedFilter
                  key={String(column.id)}
                  column={table.getColumn(column.id ? String(column.id) : "")}
                  title={column.label}
                  options={column.options ?? []}
                />
              ),
          )}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="ml-2 size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            role="combobox"
            size="sm"
            className="ml-auto h-8 gap-2 focus:outline-none focus:ring-1 focus:ring-ring focus-visible:ring-0"
          >
            <PlusCircle size={16} aria-hidden="true" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {pathname.includes("/recipes") && (
            <DropdownMenuItem onClick={() => handleCreateAction}>
              Create recipe
            </DropdownMenuItem>
          )}
          {pathname.includes("/stock-transfers") && (
            <>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                Create ST
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleCreateAction("start-of-day")}
              >
                Start of day ST
              </DropdownMenuItem>
              <DropdownMenuItem>Mini ST</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

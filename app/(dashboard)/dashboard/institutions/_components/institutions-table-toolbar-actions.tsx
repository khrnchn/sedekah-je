"use client"

import { InstitutionWithRelations, type Institution } from "@/db/schema"
import { type Table } from "@tanstack/react-table"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { exportTableToCSV } from "@/lib/export"

import { DeleteInstitutionsDialog } from "./delete-institutions-dialog"

interface InstitutionsTableToolbarActionsProps {
  table: Table<Institution>
}

export function InstitutionsTableToolbarActions({
  table,
}: InstitutionsTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteInstitutionsDialog
          institutions={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "institutions",
            excludeColumns: ["select", "actions"],
          })
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        Export
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  )
}

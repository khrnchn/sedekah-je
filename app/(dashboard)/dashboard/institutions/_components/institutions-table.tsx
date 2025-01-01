"use client";

import { institutions, type Institution } from "@/db/schema";
import type {
  DataTableAdvancedFilterField,
  DataTableFilterField,
  DataTableRowAction,
} from "@/app/types";
import * as React from "react";

import { DataTable } from "@/components/datatable/data-table";
import { DataTableAdvancedToolbar } from "@/components/datatable/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/datatable/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase, toTitleCase } from "@/lib/utils";

import type {
  getInstitutionStatusCounts,
  getInstitutions,
} from "../_lib/queries";

import { getDeliveryStatusIcon } from "../_lib/utils";
import { DeleteInstitutionsDialog } from "./delete-institutions-dialog";
import { useFeatureFlags } from "../../../../../components/datatable/feature-flags-provider";
import { getColumns } from "./institutions-table-columns";
import { InstitutionsTableFloatingBar } from "./institutions-table-floating-bar";
import { InstitutionsTableToolbarActions } from "./institutions-table-toolbar-actions";
import { UpdateInstitutionSheet } from "./update-institutions-sheet";

interface InstitutionsTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getInstitutions>>,
      Awaited<ReturnType<typeof getInstitutionStatusCounts>>
    ]
  >;
}

export function InstitutionsTable({ promises }: InstitutionsTableProps) {
  const { featureFlags } = useFeatureFlags();

  const [{ data, pageCount }, statusCounts] = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Institution> | null>(null);

  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction]
  );

  /**
      * This component can render either a faceted filter or a search filter based on the `options` prop.
      *
      * @prop options - An array of objects, each representing a filter option. If provided, a faceted filter is
      rendered. If not, a search filter is rendered.
      *
      * Each `option` object has the following properties:
      * @prop {string} label - The label for the filter option.
      * @prop {string} value - The value for the filter option.
      * @prop {React.ReactNode} [icon] - An optional icon to display next to the label.
      * @prop {boolean} [withCount] - An optional boolean to display the count of the filter option.
      */
  const filterFields: DataTableFilterField<Institution>[] = [
    // for normal searching, this only works on string columns
    {
      id: "institutionNumber",
      label: "Institution Number",
      placeholder: "Filter institution number...",
    },
    {
      id: "deliveryStatus",
      label: "Delivery Status",
      options: institutions.deliveryStatus.enumValues.map((status) => ({
        label: toPascalCase(status),
        value: status,
        icon: getDeliveryStatusIcon(status),
        count: statusCounts[status],
      })),
    },
  ];

  /**
   * Advanced filter fields for the data table.
   * These fields provide more complex filtering options compared to the regular filterFields.
   *
   * Key differences from regular filterFields:
   * 1. More field types: Includes 'text', 'multi-select', 'date', and 'boolean'.
   * 2. Enhanced flexibility: Allows for more precise and varied filtering options.
   * 3. Used with DataTableAdvancedToolbar: Enables a more sophisticated filtering UI.
   * 4. Date and boolean types: Adds support for filtering by date ranges and boolean values.
   */
  const advancedFilterFields: DataTableAdvancedFilterField<Institution>[] = [
    {
      id: "institutionNumber",
      label: "Institution Number",
      type: "number",
    },
    {
      id: "deliveryStatus",
      label: "Delivery Status",
      type: "multi-select",
      options: institutions.deliveryStatus.enumValues.map((status) => ({
        label: toSentenceCase(status),
        value: status,
        icon: getDeliveryStatusIcon(status),
        count: statusCounts[status],
      })),
    },
    {
      id: "createdAt",
      label: "Created at",
      type: "date",
    },
  ];

  const enableAdvancedTable = featureFlags.includes("advancedTable");
  const enableFloatingBar = featureFlags.includes("floatingBar");

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    enableAdvancedFilter: enableAdvancedTable,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        floatingBar={
          enableFloatingBar ? (
            <InstitutionsTableFloatingBar table={table} />
          ) : null
        }
      >
        {enableAdvancedTable ? (
          <DataTableAdvancedToolbar
            table={table}
            filterFields={advancedFilterFields}
            shallow={false}
          >
            <InstitutionsTableToolbarActions table={table} />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table} filterFields={filterFields}>
            <InstitutionsTableToolbarActions table={table} />
          </DataTableToolbar>
        )}
      </DataTable>
      <UpdateInstitutionSheet
        open={rowAction?.type === "update"}
        onOpenChange={() => setRowAction(null)}
        institution={rowAction?.row.original ?? null}
      />
      <DeleteInstitutionsDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        institutions={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}

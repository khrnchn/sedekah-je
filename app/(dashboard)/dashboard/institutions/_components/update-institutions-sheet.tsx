"use client"

import * as React from "react"
import { institutions, type Institution } from "@/db/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import { updateInstitution } from "../_lib/actions"
import { updateInstitutionSchema, type UpdateInstitutionSchema } from "../_lib/validations"
import { toTitleCase } from "@/lib/utils"

interface UpdateInstitutionSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  institution: Institution | null
}

export function UpdateInstitutionSheet({ institution, ...props }: UpdateInstitutionSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition()

  const form = useForm<UpdateInstitutionSchema>({
    resolver: zodResolver(updateInstitutionSchema),
    defaultValues: {
      note: institution?.note ?? "",
      deliveryStatus: institution?.deliveryStatus,
    },
  })

  React.useEffect(() => {
    form.reset({
      note: institution?.note ?? "",
      deliveryStatus: institution?.deliveryStatus,
    })
  }, [institution, form])

  function onSubmit(input: UpdateInstitutionSchema) {
    startUpdateTransition(async () => {
      if (!institution) return

      const { error } = await updateInstitution({
        id: institution.id,
        ...input,
      })

      if (error) {
        toast.error(error)
        return
      }

      form.reset()
      props.onOpenChange?.(false)
      toast.success("Institution updated")
    })
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Update Institution</SheetTitle>
          <SheetDescription>
            Update the institution details and save the changes
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Do a kickflip"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        { institutions.deliveryStatus.enumValues.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                          >
                            {toTitleCase(item)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="gap-2 pt-2 sm:space-x-0">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={isUpdatePending}>
                {isUpdatePending && (
                  <Loader
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Save
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

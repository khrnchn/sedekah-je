"use client";

import { InstitutionWithRelations, type Institution } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { updateInstitution } from "../_lib/actions";
import { getCategories, getCities, getStates } from "../_lib/queries";
import {
  updateInstitutionSchema,
  type UpdateInstitutionSchema,
} from "../_lib/validations";
import { useCallback, useEffect, useState, useTransition } from "react";

interface UpdateInstitutionSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  institution: Institution | null;
}

export function UpdateInstitutionSheet({
  institution,
  ...props
}: UpdateInstitutionSheetProps) {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<
    { id: number; name: string; stateId: number }[]
  >([]);
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!institution) return;

    setIsLoading(true);
    fetch(`/api/institutions?stateId=${institution.stateId}`)
      .then((res) => res.json())
      .then(({ categories, states, cities }) => {
        setCategories(categories);
        setStates(states);
        setCities(cities);
      })
      .catch(() => {
        toast.error("Failed to fetch initial data");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [institution]);

  // Fetch cities when state changes
  const handleStateChange = useCallback(async (stateId: string) => {
    const response = await fetch(`/api/institutions?stateId=${stateId}`);
    const { cities } = await response.json();
    setCities(cities);
    form.setValue("cityId", undefined); // Reset city when state changes
  }, []);

  const form = useForm<UpdateInstitutionSchema>({
    resolver: zodResolver(updateInstitutionSchema),
    defaultValues: {
      name: institution?.name ?? "",

      categoryId: institution?.categoryId ? institution.categoryId : undefined,
      stateId: institution?.stateId ? institution.stateId : undefined,
      cityId: institution?.cityId ? institution.cityId : undefined,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: institution?.name ?? "",

      categoryId: institution?.categoryId ? institution.categoryId : undefined,
      stateId: institution?.stateId ? institution.stateId : undefined,
      cityId: institution?.cityId ? institution.cityId : undefined,
    });
  }, [institution, form]);

  function onSubmit(input: UpdateInstitutionSchema) {
    startUpdateTransition(async () => {
      if (!institution) return;

      const { error } = await updateInstitution({
        id: institution.id,
        ...input,
      });

      if (error) {
        toast.error(error);
        return;
      }

      form.reset();
      props.onOpenChange?.(false);
      toast.success("Institution updated");
    });
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution Name</FormLabel>
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(BigInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(BigInt(value));
                      handleStateChange(value);
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {states.map((state) => (
                          <SelectItem
                            key={state.id}
                            value={state.id.toString()}
                          >
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(BigInt(value))}
                    value={field.value?.toString()}
                    disabled={!form.watch("stateId")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
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
  );
}

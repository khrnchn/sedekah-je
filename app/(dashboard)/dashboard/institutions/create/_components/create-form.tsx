"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Category, City, PaymentMethod, State } from "@/db/schema";
import { toTitleCase } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { revalidatePath } from "next/cache";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createInstitution } from "../_lib/actions";
import { createInstitutionSchema } from "../_lib/validations";
import { LocationSearch } from "./location-search";
import { Payment } from "./sections/payment";
import QRSkeleton from "./sections/qr";

interface CreateInstitutionFormProps {
  categories: Category[];
  states: State[];
  cities: City[];
  socialPlatforms: Array<{
    id: number;
    name: string;
    baseUrl: string | null;
  }>;
  paymentMethods: PaymentMethod[];
}

export function CreateInstitutionForm({
  categories,
  states,
  cities,
  socialPlatforms,
  paymentMethods,
}: CreateInstitutionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter()

  const form = useForm<z.infer<typeof createInstitutionSchema>>({
    resolver: zodResolver(createInstitutionSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: undefined,
      stateId: undefined,
      cityId: undefined,
      latitude: 0,
      longitude: 0,
      address: "",
      paymentMethodIds: [],
    },
  });

  // watch selected state to filter cities
  const selectedStateId = useWatch({ control: form.control, name: "stateId" });
  const filteredCities = cities.filter((city) => city.stateId === selectedStateId);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
    form.setValue("address", address);
  };

  async function onSubmit(data: z.infer<typeof createInstitutionSchema>) {
    try {
      setIsSubmitting(true);

      const res = await createInstitution(data);

      if (!res.success) {
        toast.error("Failed to create institution!")
        return;
      }

      toast.success("Institution created successfully!");
      form.reset(); // TODO: dia tak clear semua field, maybe kena guna react-hook-form
      // window.location.reload() kalau reload page macam tak best pula
    } catch (error) {
      toast.error("Something went wrong!");
      console.log("error: ", error)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Section */}
                <div className="lg:col-span-2 space-y-4">

                  {/* General Information */}
                  <FormField
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="eg: Masjid Al Muhtadin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="eg: Masjid ni dekat atas bukit damansara damai. Aku snap masa solat jumaat"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {toTitleCase(category.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Section */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        name="stateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                const numValue = Number(value);
                                field.onChange(numValue);
                                form.resetField("cityId");
                              }}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state.id} value={state.id.toString()}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="cityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={field.value?.toString()}
                              disabled={!selectedStateId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredCities.map((city) => (
                                  <SelectItem key={city.id} value={city.id.toString()}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Location Search */}
                    <LocationSearch onLocationSelect={handleLocationSelect} />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter address" {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Right Section */}
                <div className="lg:col-span-1 space-y-8">
                  <Payment paymentMethods={paymentMethods} />
                  <QRSkeleton />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Institution"}
              </Button>
            </form>
          </Form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
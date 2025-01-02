"use client";

import { createInstitutionSchema } from "@/app/(dashboard)/dashboard/institutions/_lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form"; // Import useWatch
import { toast } from "sonner";
import { z } from "zod";
import { createInstitution } from "../_lib/actions";
import { General } from "./sections/general";
import { Location } from "./sections/location";
import { Social } from "./sections/social";
import { Payment } from "./sections/payment";
import { Category, City, PaymentMethod, State } from "@/db/schema";

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
      socialLinks: [],
      paymentMethodIds: [],
    },
  });

  // Watch the stateId field to update selectedStateId
  const selectedStateId = useWatch({
    control: form.control,
    name: "stateId",
  });

  const onSubmit = async (values: z.infer<typeof createInstitutionSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Form values:", values); // Log form values

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      console.log("FormData:", Array.from(formData.entries())); // Log FormData

      await createInstitution(formData);
      toast.success("Institution created successfully");
      form.reset();
    } catch (error) {
      toast.error("Failed to create institution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (Main Form) */}
              <div className="lg:col-span-2">
                <General control={form.control} categories={categories} />
                <Location
                  control={form.control}
                  states={states}
                  cities={cities}
                  selectedStateId={selectedStateId} // Pass the watched stateId
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              {/* Right Column (Side Card) */}
              <div className="lg:col-span-1 space-y-8">
                <Social
                  control={form.control}
                  socialPlatforms={socialPlatforms}
                />
                <Payment paymentMethods={paymentMethods} />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Institution"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

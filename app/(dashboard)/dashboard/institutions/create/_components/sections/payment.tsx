"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";

interface PaymentMethodsCardProps {
  paymentMethods: Array<{
    id: number;
    name: string;
  }>;
}

export function Payment({ paymentMethods }: PaymentMethodsCardProps) {
  const { control, watch, setValue } = useFormContext();
  const selectedMethods: number[] = watch("paymentMethodIds") || [];

  const handleTogglePaymentMethod = (methodId: number) => {
    const updatedMethods = selectedMethods.includes(methodId)
      ? selectedMethods.filter((id) => id !== methodId) // Remove methodId if it exists
      : [...selectedMethods, methodId]; // Add methodId if it doesn't exist

    setValue("paymentMethodIds", updatedMethods);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Supported Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="paymentMethodIds"
          render={() => (
            <FormItem>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`payment-method-${method.id}`}
                        checked={selectedMethods.includes(method.id)}
                        onCheckedChange={() => handleTogglePaymentMethod(method.id)}
                      />
                      <label
                        htmlFor={`payment-method-${method.id}`}
                        className="text-sm"
                      >
                        {method.name}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2 mt-4">
          {selectedMethods.map((methodId) => {
            const paymentMethod = paymentMethods.find(
              (pm) => pm.id === methodId
            );
            return (
              <Badge key={methodId} variant="secondary">
                {paymentMethod?.name}
                <button
                  type="button"
                  className="ml-1 hover:text-destructive"
                  onClick={() => handleTogglePaymentMethod(methodId)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
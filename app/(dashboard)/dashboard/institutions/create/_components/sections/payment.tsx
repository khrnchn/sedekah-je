"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

interface PaymentMethodsCardProps {
  paymentMethods: Array<{
    id: number;
    name: string;
  }>;
}

export function Payment({ paymentMethods }: PaymentMethodsCardProps) {
  const { control, watch } = useFormContext(); // Access the form context
  const { fields, append, remove } = useFieldArray({
    control,
    name: "paymentMethodIds",
  });

  const selectedPaymentMethods = watch("paymentMethodIds") || [];

  const handleTogglePaymentMethod = (methodId: number) => {
    const isSelected = selectedPaymentMethods.some((method: any) => method.id === methodId);
    if (isSelected) {
      const index = selectedPaymentMethods.findIndex((method: any) => method.id === methodId);
      remove(index);
    } else {
      append({ id: methodId });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Supported Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center gap-2">
                <Checkbox
                  id={`payment-method-${method.id}`}
                  checked={selectedPaymentMethods.some((m: any) => m.id === method.id)}
                  onCheckedChange={() => handleTogglePaymentMethod(method.id)}
                />
                <label htmlFor={`payment-method-${method.id}`} className="text-sm">
                  {method.name}
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedPaymentMethods.map((method: any) => {
              const paymentMethod = paymentMethods.find((pm) => pm.id === method.id);
              return (
                <Badge key={method.id} variant="secondary">
                  {paymentMethod?.name}
                  <button
                    type="button"
                    className="ml-1 hover:text-destructive"
                    onClick={() => {
                      const index = selectedPaymentMethods.findIndex((m: any) => m.id === method.id);
                      remove(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
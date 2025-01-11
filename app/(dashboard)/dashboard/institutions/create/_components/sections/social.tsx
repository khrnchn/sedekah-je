"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

interface SocialLink {
  platformId: number;
  url: string;
}

interface SocialLinksCardProps {
  socialPlatforms: Array<{
    id: number;
    name: string;
    baseUrl: string | null;
  }>;
}

export function Social({ socialPlatforms }: SocialLinksCardProps) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks",
  });

  // Watch the socialLinks array to track selected platforms
  const socialLinks = useWatch({
    control,
    name: "socialLinks",
    defaultValue: [],
  }) as SocialLink[]; // Explicitly type the socialLinks array

  // Get the list of already selected platform IDs
  const selectedPlatformIds = socialLinks.map(
    (link: SocialLink) => link.platformId
  );

  // Filter out platforms that are already selected
  const availablePlatforms = socialPlatforms.filter(
    (platform) => !selectedPlatformIds.includes(platform.id)
  );

  // Handle adding a new social link
  const handleAddLink = () => {
    if (fields.length < socialPlatforms.length) {
      append({ platformId: 0, url: "" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Social Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddLink}
            disabled={fields.length >= socialPlatforms.length} // Disable button if all platforms are used
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>

          {fields.map((field, index) => {
            // Find the selected platform name based on the platformId
            const selectedPlatform = socialPlatforms.find(
              (platform) => platform.id === socialLinks[index]?.platformId
            );
            const selectedPlatformName =
              selectedPlatform?.name || "Select platform";

            return (
              <div key={field.id} className="flex items-end gap-4">
                <FormField
                  control={control}
                  name={`socialLinks.${index}.platformId`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            ...availablePlatforms,
                            // Include currently selected platform if it exists
                            ...(field.value
                              ? socialPlatforms.filter(
                                (p) => p.id === field.value
                              )
                              : []),
                          ].map((platform) => (
                            <SelectItem
                              key={platform.id}
                              value={platform.id.toString()}
                            >
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`socialLinks.${index}.url`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormControl>
                        <Input placeholder="URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
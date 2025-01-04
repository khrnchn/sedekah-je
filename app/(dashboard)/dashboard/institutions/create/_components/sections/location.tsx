import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { City, State } from "@/db/schema";
import { LocationSearch } from "../location-search";
import { useFormContext } from "react-hook-form"; // Import useFormContext

interface LocationSectionProps {
  states: State[];
  cities: City[];
  selectedStateId: number | null;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

export function Location({ states, cities, selectedStateId, onLocationSelect }: LocationSectionProps) {
  const { setValue, control } = useFormContext(); 

  const filteredCities = cities.filter((city) => city.stateId === selectedStateId);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select
                onValueChange={(value) => {
                  const numValue = Number(value);
                  field.onChange(numValue);
                  setValue("cityId", null); // Reset cityId when state changes
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
          control={control}
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

      <LocationSearch onLocationSelect={onLocationSelect} />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
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
          control={control}
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
    </div>
  );
}
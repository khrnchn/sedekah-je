"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function InstitutionForm() {
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const handleQrImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setQrImageUrl(url);
    }
  };

  const states = {
    Selangor: ["Shah Alam", "Petaling Jaya", "Subang Jaya"],
    "Kuala Lumpur": ["Bukit Bintang", "Cheras", "Wangsa Maju"],
    Penang: ["George Town", "Butterworth", "Bayan Lepas"],
  };

  return (
    <Card className="rounded-lg border-none mt-6">
      <CardContent className="p-6">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">General Information</h3>
            <Separator className="my-4" />
            <div>
              <Label htmlFor="type">Institution Type</Label>
              <Select>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select institution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mosque">Mosque</SelectItem>
                  <SelectItem value="surau">Surau</SelectItem>
                  <SelectItem value="rumah-kebajikan">
                    Rumah Kebajikan
                  </SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Institution Name</Label>
              <Input id="name" placeholder="Enter institution name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select onValueChange={(value) => setSelectedState(value)}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(states).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Select>
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedState &&
                      states[selectedState].map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" placeholder="Enter Facebook URL" />
            </div>

            {/* <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" placeholder="Enter Instagram URL" />
            </div> */}

            {/* <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input id="tiktok" placeholder="Enter TikTok URL" />
            </div> */}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold">QR Code Information</h3>
            <Separator className="my-4" />
            <div>
              <Label htmlFor="qr-image">Institution QR Image</Label>
              <Input
                id="qr-image"
                type="file"
                accept="image/*"
                onChange={handleQrImageUpload}
              />
              {qrImageUrl && (
                <div className="mt-2">
                  <img
                    src={qrImageUrl}
                    alt="QR Code Preview"
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Supported Payments</Label>
              <div className="flex space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="duitnow" />
                  <label htmlFor="duitnow">DuitNow</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="touch-n-go" />
                  <label htmlFor="touch-n-go">Touch 'n Go</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="boost" />
                  <label htmlFor="boost">Boost</label>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex space-x-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                /* Add reset logic here */
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                /* Add reset logic here */
              }}
            >
              Create & Create Another
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

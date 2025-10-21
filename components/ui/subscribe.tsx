"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useSubscribe from "@/hooks/use-subscribe";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";

export default function Subscribe() {
  const { email, setEmail, loading, open, setOpen, handleSubscribe } =
    useSubscribe();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
        >
          <Mail className="h-4 w-4 text-white" aria-hidden="true" />
          <span className="text-white">Subscribe</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to our newsletter</DialogTitle>
          <DialogDescription>
            Enter your email to receive weekly random Masjid QR.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubscribe} className="flex flex-col gap-3 mt-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

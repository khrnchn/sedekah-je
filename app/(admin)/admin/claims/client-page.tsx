"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Check, Clock, X } from "lucide-react";
import { Suspense, useState } from "react";
import AsyncApprovedClaims from "./async-approved-claims";
import AsyncPendingClaims from "./async-pending-claims";
import AsyncRejectedClaims from "./async-rejected-claims";
import ClaimsTableLoading from "./table-loading";

export default function ClaimsClientPage() {
	const { user, isAuthenticated } = useAuth();
	const [activeTab, setActiveTab] = useState("pending");

	if (!isAuthenticated || user?.role !== "admin") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>Access denied</p>
			</div>
		);
	}

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger value="pending">
					<Clock className="h-4 w-4 mr-2" />
					Pending
				</TabsTrigger>
				<TabsTrigger value="approved">
					<Check className="h-4 w-4 mr-2" />
					Approved
				</TabsTrigger>
				<TabsTrigger value="rejected">
					<X className="h-4 w-4 mr-2" />
					Rejected
				</TabsTrigger>
			</TabsList>

			<TabsContent value="pending" className="mt-6">
				<Suspense fallback={<ClaimsTableLoading />}>
					<AsyncPendingClaims />
				</Suspense>
			</TabsContent>

			<TabsContent value="approved" className="mt-6">
				<Suspense fallback={<ClaimsTableLoading />}>
					<AsyncApprovedClaims />
				</Suspense>
			</TabsContent>

			<TabsContent value="rejected" className="mt-6">
				<Suspense fallback={<ClaimsTableLoading />}>
					<AsyncRejectedClaims />
				</Suspense>
			</TabsContent>
		</Tabs>
	);
}

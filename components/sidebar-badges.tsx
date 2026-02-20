import { getPendingClaimRequestsCount } from "@/app/(admin)/admin/claim-requests/_lib/queries";
import {
	getApprovedInstitutionsCount,
	getPendingInstitutionsCount,
	getRejectedInstitutionsCount,
} from "@/app/(admin)/admin/institutions/_lib/queries";
import { Badge } from "@/components/ui/badge";
import { getTotalUsersCount } from "@/lib/queries/users";
import { Suspense } from "react";

// Async badge components that stream in
async function PendingBadge() {
	try {
		const count = await getPendingInstitutionsCount();
		if (count === 0) return <></>;
		return <Badge variant="destructive">{count}</Badge>;
	} catch {
		return <></>;
	}
}

async function ApprovedBadge() {
	try {
		const count = await getApprovedInstitutionsCount();
		if (count === 0) return <></>;
		return <Badge variant="default">{count}</Badge>;
	} catch {
		return <></>;
	}
}

async function RejectedBadge() {
	try {
		const count = await getRejectedInstitutionsCount();
		if (count === 0) return <></>;
		return <Badge variant="destructive">{count}</Badge>;
	} catch {
		return <></>;
	}
}

async function ClaimsBadge() {
	try {
		const count = await getPendingClaimRequestsCount();
		if (count === 0) return <></>;
		return <Badge variant="destructive">{count}</Badge>;
	} catch {
		return <></>;
	}
}

async function UsersBadge() {
	try {
		const count = await getTotalUsersCount();
		if (count === 0) return <></>;
		return <Badge variant="default">{count}</Badge>;
	} catch {
		return <></>;
	}
}

// Placeholder badge for loading state
function BadgePlaceholder() {
	return <div className="h-5 w-6 bg-muted rounded animate-pulse" />;
}

// Exported components with Suspense boundaries
export function AsyncPendingBadge() {
	return (
		<Suspense fallback={<BadgePlaceholder />}>
			<PendingBadge />
		</Suspense>
	);
}

export function AsyncApprovedBadge() {
	return (
		<Suspense fallback={<BadgePlaceholder />}>
			<ApprovedBadge />
		</Suspense>
	);
}

export function AsyncRejectedBadge() {
	return (
		<Suspense fallback={<BadgePlaceholder />}>
			<RejectedBadge />
		</Suspense>
	);
}

export function AsyncClaimsBadge() {
	return (
		<Suspense fallback={<BadgePlaceholder />}>
			<ClaimsBadge />
		</Suspense>
	);
}

export function AsyncUsersBadge() {
	return (
		<Suspense fallback={<BadgePlaceholder />}>
			<UsersBadge />
		</Suspense>
	);
}

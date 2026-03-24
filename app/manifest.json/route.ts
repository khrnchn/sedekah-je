import manifest from "@/app/manifest";

export function GET() {
	return Response.json(manifest());
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { getInstitutions } from "./lib/actions";
import { formatDate } from "@/lib/utils";

const InstitutionsTable = async () => {
  const institutions = await getInstitutions();

  return (
    <>
      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">QR Content</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Created at
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={`${institution.name} image`}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={"/placeholder.svg"}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {institution.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{institution.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {institution.city}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {institution.state}
                  </TableCell>
                  <TableCell>
                    <Badge variant={institution.status === 'rejected' ? 'destructive' : 'default'}>
                      {institution.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(institution.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{institutions.length}</strong> of <strong>{institutions.length}</strong> institutions
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default InstitutionsTable;

import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";
import { Metadata, ResolvingMetadata } from 'next';

type Props = {
    params: {
        slug: string;
    };
    searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = params.slug;

    const institution = institutions.find(
        (institution) => slugify(institution.name) === slug
    );

    if (!institution) {
        return {
            title: 'Not Found',
        };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const baseUrl = 'http://sedekahje.com';

    return {
        title: institution.name,
        openGraph: {
            title: institution.name,
            description: `Information about ${institution.name}`,
            images: [`${baseUrl}/qr/${slug}`, ...previousImages],
        },
        twitter: {
            card: 'summary_large_image',
            title: institution.name,
            description: `Information about ${institution.name}`,
            images: [`${baseUrl}/qr/${slug}`],
        },
    };
}

export default function InstitutionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
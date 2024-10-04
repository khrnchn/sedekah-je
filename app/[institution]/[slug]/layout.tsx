import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";
import { Metadata, ResolvingMetadata } from 'next';

type LayoutProps = {
    params: {
        slug: string;
    };
};

export async function generateMetadata(
    { params }: LayoutProps,
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
            description: `Jom #Sedekahje untuk ${institution.name}`,
            images: [`${baseUrl}/api/og/${slug}`, ...previousImages],
        },
        twitter: {
            card: 'summary_large_image',
            title: institution.name,
            description: `Jom #Sedekahje untuk ${institution.name}`,
            images: [`${baseUrl}/api/og/${slug}`],
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
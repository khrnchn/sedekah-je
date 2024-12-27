import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";
import type { Metadata, ResolvingMetadata } from 'next';
import Script from 'next/script';

type LayoutProps = {
    params: {
        institution: string;
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
            robots: {
                index: false,
                follow: false,
            }
        };
    }

    const baseUrl = 'https://sedekah.je';
    const canonicalUrl = `${baseUrl}/${params.institution}/${slug}`;
    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${institution.name} - Sedekah Digital`,
        description: `Salurkan sumbangan anda kepada ${institution.name} melalui Sedekah Je dengan hanya satu imbasan QR.`,
        alternates: {
            canonical: canonicalUrl
        },
        openGraph: {
            title: `Sedekah untuk ${institution.name}`,
            description: `Jom #Sedekahje untuk ${institution.name}. Platform digital untuk memudahkan sumbangan anda.`,
            url: canonicalUrl,
            images: [`${baseUrl}/api/og/${slug}`, ...previousImages],
            locale: 'ms_MY',
            type: 'website'
        },
        twitter: {
            card: 'summary_large_image',
            title: institution.name,
            site: '@sedekahje',
            description: `Jom #Sedekahje untuk ${institution.name}. Platform digital untuk memudahkan sumbangan anda.`,
            images: [`${baseUrl}/api/og/${slug}`],
        },
    };
}

export default function InstitutionLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { slug: string };
}) {
    const institution = institutions.find(
        (institution) => slugify(institution.name) === params.slug
    );

    return (
        <>
            {institution && (
                <Script
                    id="institution-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: institution.name,
                            url: `https://sedekah.je/${params.slug}`,
                            description: `Platform digital untuk sumbangan melalui QR kepada ${institution.name}`,
                        })
                    }}
                />
            )}
            {children}
        </>
    );
}
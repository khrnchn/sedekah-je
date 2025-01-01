import BloomCrumb from '@/components/custom/bloom-crumb'
import { BloomHeader } from '@/components/custom/bloom-header'
import { Layout, LayoutBody } from '@/components/ui/layout'
import { getValidFilters } from '@/lib/data-table'
import { SearchParams } from '@/types'
import { InstitutionsTable } from './_components/institutions-table'
import { getInstitutions, getInstitutionStatusCounts } from './_lib/queries'
import { searchParamsCache } from './_lib/validations'

interface IndexPageProps {
    searchParams: Promise<SearchParams>
}

export default async function InstitutionsPage(props: IndexPageProps) {
    const searchParams = await props.searchParams;
    const search = searchParamsCache.parse(searchParams);

    const validFilters = getValidFilters(search.filters);

    const promises = Promise.all([
        getInstitutions({
            ...search,
            filters: validFilters,
        }),
        getInstitutionStatusCounts(),
    ])

    return (
        <Layout>
            <BloomCrumb
                items={[
                    { label: 'Institutions', href: '#' },
                    { label: 'List of Institutions', href: '/dashboard/institutions/institutions' },
                ]}
            />
            <LayoutBody>
                <div className="max-w-7xl mx-auto">
                    <BloomHeader title='List of Institutions' description='Monitor institutions here' />
                    {/* uncomment the provider to use advanced filtering */}
                    {/* <FeatureFlagsProvider> */}
                    <InstitutionsTable promises={promises} />
                    {/* </FeatureFlagsProvider > */}
                </div>
            </LayoutBody>
        </Layout>
    )
}
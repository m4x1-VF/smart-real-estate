import PropertyForm from '@/components/admin/PropertyForm';
import { getPropertyBySlug } from '@/lib/db/properties';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditPropertyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const property = await getPropertyBySlug(params.id);

  if (!property) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
  const tForm = getDictionary(locale).dashboard.property_form;
  const tCommon = getDictionary(locale).dashboard.common;

  return (
    <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div className="space-y-4">
          <nav aria-label={tForm.breadcrumb_aria} className="flex">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 font-medium font-sans">
              <li>
                <Link
                  href="/admin/properties"
                  className="hover:text-mosque transition-colors"
                >
                  {tForm.breadcrumb.properties}
                </Link>
              </li>
              <li>
                <span className="material-icons text-xs text-gray-400">
                  chevron_right
                </span>
              </li>
              <li aria-current="page" className="text-nordic">
                {tForm.breadcrumb.edit.replace('{title}', property.title)}
              </li>
            </ol>
          </nav>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-nordic tracking-tight mb-2">
              {tCommon.page_title_edit}
            </h1>
            <p className="text-base text-gray-500 max-w-2xl font-normal font-sans">
              {tCommon.page_subtitle_edit}
            </p>
          </div>
        </div>
      </header>
      <PropertyForm t={tForm} initialData={property} />
    </main>
  );
}

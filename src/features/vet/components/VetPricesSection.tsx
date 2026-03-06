import type { ExamCatalogItem } from '../../../types/app'
import { useI18n } from '../../../i18n'
import { formatCurrency } from '../../../utils/format'

type VetPricesSectionProps = {
  examCatalog: ExamCatalogItem[]
}

export default function VetPricesSection({ examCatalog }: VetPricesSectionProps) {
  const { t } = useI18n()

  return (
    <section className="section">
      <h2>{t('vetPrices.title')}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('vetPrices.table.category')}</th>
              <th>{t('vetPrices.table.exam')}</th>
              <th>{t('vetPrices.table.description')}</th>
              <th>{t('vetPrices.table.currentPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {examCatalog.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.category ?? t('vetPrices.notInformed')}</td>
                <td>{exam.name}</td>
                <td>{exam.description ?? t('vetPrices.notInformed')}</td>
                <td>{formatCurrency(exam.current_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

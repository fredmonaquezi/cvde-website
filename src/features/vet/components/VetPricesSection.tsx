import type { ExamCatalogItem } from '../../../types/app'
import { formatCurrency } from '../../../utils/format'

type VetPricesSectionProps = {
  examCatalog: ExamCatalogItem[]
}

export default function VetPricesSection({ examCatalog }: VetPricesSectionProps) {
  return (
    <section className="section">
      <h2>Updated Value Table</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Exam</th>
              <th>Description</th>
              <th>Current price</th>
            </tr>
          </thead>
          <tbody>
            {examCatalog.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.category ?? '-'}</td>
                <td>{exam.name}</td>
                <td>{exam.description ?? '-'}</td>
                <td>{formatCurrency(exam.current_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

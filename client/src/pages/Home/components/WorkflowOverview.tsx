/**
 * Workflow overview section component for Home page
 * 
 * Displays the complete project workflow from creation to act signing
 */
export default function WorkflowOverview() {
  return (
    <div className="mt-32">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
          Полный цикл работы с проектом
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          От создания сметы до подписания акта — всё в одном месте
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {[
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ),
            title: 'Создание',
            desc: 'ИИ, Google Sheets или вручную',
            boxClass: 'bg-purple-500/15 border-purple-500/25 text-purple-400',
          },
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            title: 'Редактирование',
            desc: 'Разделы, позиции, цены',
            boxClass: 'bg-primary-500/15 border-primary-500/25 text-primary-400',
          },
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            ),
            title: 'Публикация',
            desc: 'Ссылки для участников',
            boxClass: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400',
          },
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
            title: 'Материалы',
            desc: 'Парсинг цен из магазинов',
            boxClass: 'bg-accent-500/15 border-accent-500/25 text-accent-400',
          },
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            title: 'Акт работ',
            desc: 'Документ для подписания',
            boxClass: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
          },
        ].map((item, i) => (
          <div key={item.title} className="relative animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-3 ${item.boxClass}`}>
                {item.icon}
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            {i < 4 && (
              <div className="hidden md:block absolute top-7 -right-2 w-4 text-slate-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


/**
 * Features section component for Home page
 * 
 * Displays key features in a 3-column grid and extended features in a 2x3 grid
 */
export default function FeaturesSection() {
  return (
    <>
      {/* Key Features — 3 columns */}
      <div className="mt-32">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Всё для работы со сметами
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Комплексное решение для строительных компаний, прорабов и частных мастеров
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* AI Generation */}
          <div className="card animate-fade-in animate-delay-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-3">
              ИИ-генерация из PDF
            </h3>
            <p className="text-slate-400">
              Загрузите дизайн-проект в PDF — ИИ проанализирует чертежи, определит объёмы работ 
              и составит смету на основе вашего прайс-листа. За минуты вместо часов.
            </p>
          </div>

          {/* Dual pricing */}
          <div className="card animate-fade-in animate-delay-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-3">
              Два представления цен
            </h3>
            <p className="text-slate-400">
              Заказчик видит продажные цены, мастера — закупочные. 
              Маржа и внутренние расчёты надёжно скрыты. Каждый видит только свою версию по уникальной ссылке.
            </p>
          </div>

          {/* Materials with AI */}
          <div className="card animate-fade-in animate-delay-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-3">
              Учёт материалов через ИИ
            </h3>
            <p className="text-slate-400">
              Вставьте ссылки на товары из интернет-магазинов — ИИ автоматически 
              извлечёт название, артикул, бренд и цену. Обновляйте цены в один клик.
            </p>
          </div>
        </div>
      </div>

      {/* Extended Features — 2x3 grid */}
      <div className="mt-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Act Generation */}
          <div className="card group animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-white">Акты выполненных работ</h3>
            </div>
            <p className="text-sm text-slate-400">
              Генерация актов на основе сметы с возможностью выбора работ, 
              указания реквизитов сторон и формирования документа для печати.
            </p>
          </div>

          {/* Version Control */}
          <div className="card group animate-fade-in animate-delay-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-white">История версий</h3>
            </div>
            <p className="text-sm text-slate-400">
              Сохраняйте снимки состояния сметы. Сравнивайте версии и откатывайтесь 
              к любой предыдущей, если что-то пошло не так.
            </p>
          </div>

          {/* Google Sheets */}
          <div className="card group animate-fade-in animate-delay-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-white">Импорт из Google Sheets</h3>
            </div>
            <p className="text-sm text-slate-400">
              Подключите Google Таблицу — данные автоматически импортируются 
              в систему. Изменили таблицу — нажали «Синхронизировать».
            </p>
          </div>

          {/* Public Links */}
          <div className="card group animate-fade-in animate-delay-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-white">Публичные ссылки</h3>
            </div>
            <p className="text-sm text-slate-400">
              Делитесь сметой через уникальные ссылки — отдельно для заказчика и мастеров. 
              Не нужно пересылать файлы, всё всегда актуально.
            </p>
          </div>

          {/* Password Protection */}
          <div className="card group animate-fade-in animate-delay-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-white">Защита кодовой фразой</h3>
            </div>
            <p className="text-sm text-slate-400">
              Установите кодовую фразу на смету мастера — заказчик 
              не сможет случайно увидеть закупочные цены.
            </p>
          </div>

          {/* Materials KP PDF */}
          <div className="card group animate-fade-in animate-delay-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-white">КП на материалы (PDF)</h3>
            </div>
            <p className="text-sm text-slate-400">
              Формируйте коммерческое предложение на материалы 
              в формате PDF с артикулами, брендами и ценами.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}


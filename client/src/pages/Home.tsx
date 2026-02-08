import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8 animate-fade-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ИИ-генерация смет из PDF дизайн-проектов
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              Умные сметы
            </span>
            <br />
            <span className="text-white">на ремонт</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in animate-delay-100">
            Полный цикл управления сметами: от ИИ-генерации из PDF до актов выполненных работ. 
            Раздельные цены для заказчика и мастеров, учёт материалов и автоматические документы.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animate-delay-200">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-lg">
                Перейти к сметам
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg">
                  Начать бесплатно
                </Link>
                <Link to="/login" className="btn-secondary text-lg">
                  Войти в аккаунт
                </Link>
              </>
            )}
          </div>
        </div>

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

        {/* How it works */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Как это работает
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Два способа создания сметы — выбирайте удобный
            </p>
          </div>

          {/* Way 1: AI */}
          <div className="card mb-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-white">Способ 1: Через ИИ</h3>
                <p className="text-sm text-slate-500">Автоматическая генерация из дизайн-проекта</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Загрузите PDF', desc: 'Дизайн-проект с чертежами и планировками помещений' },
                { step: '02', title: 'Укажите прайс', desc: 'Ссылка на Google Таблицу с ценами на работы' },
                { step: '03', title: 'ИИ составит смету', desc: 'Анализ чертежей, оценка объёмов и расчёт стоимости' },
                { step: '04', title: 'Отредактируйте', desc: 'Проверьте результат и скорректируйте при необходимости' },
              ].map((item, i) => (
                <div key={item.step} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 mb-3">
                    <span className="font-display font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mb-1 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Way 2: Manual / Google Sheets */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-white">Способ 2: Вручную или Google Sheets</h3>
                <p className="text-sm text-slate-500">Импорт из таблицы или заполнение через интерфейс</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Создайте проект', desc: 'Подключите Google Таблицу или начните с чистого листа' },
                { step: '02', title: 'Заполните смету', desc: 'Добавьте разделы, позиции работ, цены для заказчика и мастеров' },
                { step: '03', title: 'Поделитесь', desc: 'Отправьте уникальные ссылки заказчику и мастерам' },
                { step: '04', title: 'Сформируйте акт', desc: 'Создайте акт выполненных работ для подписания' },
              ].map((item, i) => (
                <div key={item.step} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-500/10 border border-primary-500/30 mb-3">
                    <span className="font-display font-bold text-xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mb-1 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Overview */}
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

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <div className="card max-w-3xl mx-auto bg-gradient-to-br from-slate-800/80 to-slate-800/50 border-slate-600/50">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              Готовы упростить работу со сметами?
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Зарегистрируйтесь и создайте первую смету — вручную, через Google Sheets 
              или загрузив PDF дизайн-проекта для ИИ-генерации.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-primary">
                    Мои проекты
                  </Link>
                  <Link to="/projects/generate" className="btn-secondary">
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Сгенерировать из PDF
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg">
                    Создать аккаунт
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg">
                    Войти
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

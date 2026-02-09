/**
 * How it works section component for Home page
 * 
 * Displays two ways to create estimates: AI and Manual/Google Sheets
 */
export default function HowItWorksSection() {
  return (
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
  )
}


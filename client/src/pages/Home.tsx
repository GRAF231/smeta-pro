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
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              Одна таблица —
            </span>
            <br />
            <span className="text-white">несколько смет</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in animate-delay-100">
            Работайте с привычной таблицей Google Sheets, а сервис автоматически 
            создаст отдельные представления для заказчика и мастеров — с разными ценами.
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

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="card animate-fade-in animate-delay-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-3">
              Привычный Google Sheets
            </h3>
            <p className="text-slate-400">
              Формируйте смету в Google Таблицах по стандартной структуре. 
              Все расчёты — в знакомом и прозрачном формате.
            </p>
          </div>

          <div className="card animate-fade-in animate-delay-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-3">
              Разные представления
            </h3>
            <p className="text-slate-400">
              Заказчик видит продажные цены, мастера — закупочные. 
              Маржа и внутренние расчёты надёжно скрыты.
            </p>
          </div>

          <div className="card animate-fade-in animate-delay-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-3">
              Автоматическая синхронизация
            </h3>
            <p className="text-slate-400">
              Изменения в таблице сразу отражаются во всех веб-формах. 
              Не нужно пересылать новые версии.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-16">
            Как это работает
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Создайте смету', desc: 'Сформируйте смету в Google Sheets по стандартной структуре' },
              { step: '02', title: 'Подключите', desc: 'Добавьте ссылку на таблицу в сервис' },
              { step: '03', title: 'Получите ссылки', desc: 'Система создаст уникальные ссылки для заказчика и мастеров' },
              { step: '04', title: 'Поделитесь', desc: 'Отправьте ссылки участникам — каждый увидит свою версию' },
            ].map((item, i) => (
              <div key={item.step} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-4">
                  <span className="font-display font-bold text-2xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


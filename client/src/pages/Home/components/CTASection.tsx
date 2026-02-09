import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

/**
 * CTA (Call to Action) section component for Home page
 * 
 * Displays final call to action with registration/login buttons
 */
export default function CTASection() {
  const { user } = useAuth()

  return (
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
  )
}


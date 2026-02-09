import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

/**
 * Hero section component for Home page
 * 
 * Displays the main headline, description, and primary CTA buttons
 */
export default function HeroSection() {
  const { user } = useAuth()

  return (
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
        Полный цикл управления сметами: от ИИ-генерации из PDF файла дизайн-проекта до актов выполненных работ. 
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
  )
}


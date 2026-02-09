import HeroSection from './Home/components/HeroSection'
import FeaturesSection from './Home/components/FeaturesSection'
import HowItWorksSection from './Home/components/HowItWorksSection'
import WorkflowOverview from './Home/components/WorkflowOverview'
import CTASection from './Home/components/CTASection'

/**
 * Home page component
 * 
 * Landing page with hero section, features, how it works, workflow overview, and CTA
 */
export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WorkflowOverview />
        <CTASection />
      </div>
    </div>
  )
}

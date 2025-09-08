import React from 'react';
import { MapPin, Route, Shield, Zap, ArrowRight, Users, Clock, Award } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  const features = [
    {
      icon: Route,
      title: 'Smart Route Planning',
      description: 'Get multiple route options with real-time traffic data and incident alerts.'
    },
    {
      icon: Zap,
      title: 'Live Traffic Updates',
      description: 'Real-time monitoring of traffic conditions, accidents, and road closures.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Designed with driver safety in mind, featuring clear visuals and voice guidance.'
    },
    {
      icon: MapPin,
      title: 'Precise Navigation',
      description: 'Turn-by-turn directions with accurate GPS positioning and lane guidance.'
    }
  ];

  const stats = [
    { icon: Users, value: '2M+', label: 'Active Users' },
    { icon: Route, value: '50M+', label: 'Routes Planned' },
    { icon: Clock, value: '30%', label: 'Time Saved' },
    { icon: Award, value: '4.8★', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Hero Section */}
      <section className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Navigate Smarter with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Real-Time Traffic
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of navigation with intelligent route planning, live traffic updates, 
              and instant incident alerts. Get to your destination faster and safer.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Planning Routes</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-colors duration-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TrafficFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced technology meets intuitive design to deliver the best navigation experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Commute?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join millions of drivers who trust TrafficFlow for smarter, safer navigation.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
import { useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-js/react';
import { Button } from './ui/button';
import { Play } from 'lucide-react';

export const HeroVariants = () => {
  const showVariantB = useFeatureFlagEnabled('hero_variant_b');
  const buttonColorVariant = useFeatureFlagPayload('button_color_test');

  // A/B Test: Hero section variants
  if (showVariantB) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Discover Amazing
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Experience entertainment like never before with our curated collection
          </p>
          <Button 
            size="lg" 
            className={`
              text-lg px-8 py-4 rounded-full transition-all duration-300 hover:scale-105
              ${buttonColorVariant === 'green' 
                ? 'bg-green-600 hover:bg-green-700' 
                : buttonColorVariant === 'orange'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-purple-600 hover:bg-purple-700'
              }
            `}
          >
            <Play className="mr-2 h-5 w-5" />
            Start Exploring
          </Button>
        </div>
      </section>
    );
  }

  // Default Hero (Variant A)
  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-red-900 via-black to-black">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Unlimited Entertainment
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-300">
          Watch anywhere. Cancel anytime. Start your journey today.
        </p>
        <Button 
          size="lg" 
          className={`
            text-lg px-8 py-4 transition-all duration-300 hover:scale-105
            ${buttonColorVariant === 'green' 
              ? 'bg-green-600 hover:bg-green-700' 
              : buttonColorVariant === 'orange'
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-red-600 hover:bg-red-700'
            }
          `}
        >
          <Play className="mr-2 h-5 w-5" />
          Get Started
        </Button>
      </div>
    </section>
  );
};
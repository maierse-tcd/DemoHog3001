
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const Terms = () => {
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Hogflix service (referred to as "the Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Service.
            </p>
            
            <h2>2. Hedgehog-Friendly Content</h2>
            <p>
              Hogflix is committed to providing content that is suitable for hedgehogs and hedgehog enthusiasts. All content is carefully reviewed to ensure it meets our prickly standards.
            </p>
            
            <h2>3. Subscription and Billing</h2>
            <p>
              Hogflix offers various subscription plans payable in acorns, berries, or conventional currency. Subscriptions automatically renew until cancelled. Hedgehogs may qualify for special discounts with proof of spines.
            </p>
            
            <h2>4. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account information. Hogflix cannot be held responsible if your password is stolen by a fox or other woodland creature.
            </p>
            
            <h2>5. Content Usage</h2>
            <p>
              Users may not download, copy, or redistribute any content from the Service unless specifically marked for hedgehog educational purposes. Screenshots may be taken only while in a rolled-up defensive position.
            </p>
            
            <h2>6. Device Compatibility</h2>
            <p>
              Hogflix works on most devices with screens. We cannot guarantee compatibility with hibernation modes or devices operated with paws or snouts. Special snout-friendly controls are in beta.
            </p>
            
            <h2>7. Changes to Service</h2>
            <p>
              Hogflix reserves the right to modify or discontinue the Service at any time, particularly during seasonal hedgehog migrations or high hibernation seasons.
            </p>
            
            <h2>8. Termination</h2>
            <p>
              Hogflix may terminate or suspend your account if you violate these Terms of Service or exhibit un-hedgehog-like behavior, such as excessive hogging of bandwidth or prickly comments.
            </p>
            
            <h2>9. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of the European Hedgehog Union, without regard to its conflict of law provisions or whether you are an African Pygmy Hedgehog.
            </p>
            
            <p className="text-sm text-netflix-gray mt-8 italic">
              Last updated: April 28, 2025 - The day the hedgehog crossed the road safely
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;

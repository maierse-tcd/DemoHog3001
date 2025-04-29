
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const Privacy = () => {
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="lead">
              At Hogflix, we take your privacy as seriously as a hedgehog guards its favorite snacking spot. This Privacy Policy explains how we collect, use, and protect your information.
            </p>
            
            <h2>Information We Collect</h2>
            <p>
              We collect information that you provide directly, such as your name, email, and preferred snack choices. We also gather data on your watching habits, such as how many hours you spend watching our documentary "Quills: The Untold Story."
            </p>
            
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features</li>
              <li>To provide customer support</li>
              <li>To gather analysis to improve our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect technical issues</li>
              <li>To recommend content based on your quill preferences</li>
            </ul>
            
            <h2>Sharing Your Information</h2>
            <p>
              We do not share your personal information with other hedgehogs or companies, except in the following cases:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with laws</li>
              <li>To protect our rights and safety</li>
              <li>In connection with a merger or acquisition</li>
              <li>With trusted service providers who help us operate our business</li>
            </ul>
            
            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service. Cookies are small files stored on your device. No actual cookies (the edible kind) are used in this process, much to the disappointment of our hedgehog staff.
            </p>
            
            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. All data is stored in burrows at least 3 feet deep with complex tunnel systems that confuse potential data thieves.
            </p>
            
            <h2>Children's Privacy</h2>
            <p>
              Our service is not directed to anyone under the age of 13. Hoglets should have parental supervision when using our platform.
            </p>
            
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and sending a notification via carrier hedgehog to your home address.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@hogflix.example.com or leave a message under the nearest flat rock in your garden.
            </p>
            
            <p className="text-sm text-netflix-gray mt-8 italic">
              Last updated: April 28, 2025 - During the great hedgehog awakening
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;

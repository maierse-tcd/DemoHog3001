
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HelpCircle } from 'lucide-react';

const HelpPage = () => {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  
  const faqs = [
    {
      question: "Why is it called Hogflix?",
      answer: "Because regular pigs can't stream movies, but hogs can! Our founder was inspired by watching a hog trying to operate a remote control with its snout."
    },
    {
      question: "How do I change my plan?",
      answer: "You can change your plan by going to your Subscription tab. Just make sure you're not a hog, as hogs have difficulty operating dropdown menus."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "To cancel your subscription, visit your Subscription tab and click 'Cancel Subscription'. But really, who would want to cancel the greatest streaming service for both humans and hogs alike?"
    },
    {
      question: "What devices can I watch on?",
      answer: "You can watch on any device with a browser including smart TVs, game consoles, phones, tablets, and specially modified hog-friendly touch screens with reinforced snout-proof glass."
    },
    {
      question: "Why do some videos play Rick Astley?",
      answer: "We believe in the importance of never giving you up and never letting you down. Rick Astley is an integral part of the Hogflix streaming experience."
    },
    {
      question: "Is Hogflix available worldwide?",
      answer: "Hogflix is available in most countries where hedgehogs roam freely. Unfortunately, we're still negotiating rights for Antarctica, as penguins have exclusive streaming contracts there."
    },
    {
      question: "Why are there so many hedgehog-themed movies?",
      answer: "Our focus groups revealed that hedgehogs are the most underrepresented mammals in streaming content. We're simply filling a glaring gap in the entertainment industry."
    },
    {
      question: "Can I download content for offline viewing?",
      answer: "Yes! Our premium plan allows you to download content for offline viewing during hibernation seasons or when traveling in areas with poor burrow-fi coverage."
    }
  ];
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="flex items-center mb-8">
            <HelpCircle size={32} className="text-netflix-red mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold">Help Center</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-netflix-darkgray rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className="border border-netflix-gray/30 rounded-lg overflow-hidden"
                    >
                      <button 
                        onClick={() => setActiveQuestion(activeQuestion === index ? null : index)}
                        className="w-full text-left px-4 py-3 bg-netflix-gray/10 flex justify-between items-center"
                      >
                        <h4 className="font-medium">{faq.question}</h4>
                        <span className="text-2xl">{activeQuestion === index ? '−' : '+'}</span>
                      </button>
                      
                      {activeQuestion === index && (
                        <div className="px-4 py-3 bg-netflix-black/30">
                          <p className="text-netflix-gray">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-netflix-darkgray rounded-lg p-6">
                <h3 className="font-medium mb-4">Need More Help?</h3>
                <p className="text-netflix-gray mb-4">Our team of highly trained hogs are standing by to assist you.</p>
                <div className="space-y-4">
                  <div className="border border-netflix-gray/30 rounded-lg p-4 hover:bg-netflix-gray/10 transition-colors">
                    <h4 className="font-medium mb-2">Email Support</h4>
                    <p className="text-netflix-gray mb-2">Get a response within 24 hours</p>
                    <button className="text-netflix-red hover:underline">Send Email</button>
                  </div>
                  <div className="border border-netflix-gray/30 rounded-lg p-4 hover:bg-netflix-gray/10 transition-colors">
                    <h4 className="font-medium mb-2">Live Chat</h4>
                    <p className="text-netflix-gray mb-2">Chat with our support team</p>
                    <button className="text-netflix-red hover:underline">Start Chat</button>
                  </div>
                  <div className="border border-netflix-gray/30 rounded-lg p-4 hover:bg-netflix-gray/10 transition-colors">
                    <h4 className="font-medium mb-2">Phone Support</h4>
                    <p className="text-netflix-gray mb-2">Talk to a real hedgehog</p>
                    <button className="text-netflix-red hover:underline">Call Us</button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-netflix-gray text-sm italic">
                  "The most entertaining help center since the hog learned to use the remote." - Hogflix Times
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HelpPage;

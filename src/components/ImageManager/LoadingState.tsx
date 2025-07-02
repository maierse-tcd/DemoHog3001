import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-32 bg-netflix-gray rounded mb-4"></div>
              <div className="text-netflix-gray">{message}</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
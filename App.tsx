import React from 'react';
import TextureCalculatorForm from './components/TextureCalculatorForm';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white antialiased">
      <TextureCalculatorForm />
    </div>
  );
};

export default App;
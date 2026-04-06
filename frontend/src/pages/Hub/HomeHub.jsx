import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header'; 

export default function HomeHub() {
  return (
    <div className="min-h-screen flex flex-col w-full">
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 pt-24 text-center">
        <Header />
        
        <h1 className="text-3xl font-bold mt-12 text-slate-900">All Image Tools</h1>
        
        <div className="mt-8">
          <Link 
            to="/upscale" 
            className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-md"
          >
            Go to Upscale Tool
          </Link>
        </div>
      </main>


      
    </div>
  );
}
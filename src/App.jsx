import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// You can remove this if you're using Tailwind fully
// import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100">
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="h-24 w-24 hover:scale-110 transition-transform" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="h-24 w-24 animate-spin hover:animate-none" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Vite + React</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          count is {count}
        </button>
        <p className="text-gray-700">
          Edit <code className="bg-gray-200 p-1 rounded">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-500 mt-8">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
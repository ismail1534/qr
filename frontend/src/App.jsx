import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Access from './components/Access'

function App() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Secure File Share
                </h1>
                <div className="bg-surface p-6 rounded-2xl shadow-xl border border-gray-700">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/access" element={<Access />} />
                    </Routes>
                </div>
                <p className="text-center text-gray-500 mt-8 text-sm">
                    End-to-End Encrypted &bull; Ephemeral &bull; Secure
                </p>
            </div>
        </div>
    )
}

export default App

import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

export default function Home() {
    const [file, setFile] = useState(null)
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!file || !password) return

        setLoading(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("password", password)

        try {
            const res = await axios.post(`${API_URL}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            setResult(res.data)
        } catch (err) {
            console.error(err)
            setError("Upload failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (result) {
        return (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">File Uploaded!</h2>
                <p className="text-gray-400 text-sm mb-6 max-w-xs text-center break-all">
                    {result.file_name}
                </p>

                <div className="bg-white p-4 rounded-xl mb-4">
                    <img src={result.qr_image_url} alt="QR Code" className="w-48 h-48 object-contain" />
                </div>

                <div className="w-full bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">SHA-256 Checksum</p>
                    <p className="font-mono text-xs break-all text-gray-300">{result.checksum}</p>
                </div>

                <button
                    onClick={() => { setResult(null); setFile(null); setPassword(""); }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    Upload another file
                </button>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 text-center">Upload Secure File</h2>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Select File</label>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:border-primary transition-colors"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Set Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-600 transition-all"
                        placeholder="Openn@Sesame"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-accent rounded-lg font-medium text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? "Encrypting & Uploading..." : "Secure Upload"}
                </button>
            </form>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

export default function Access() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")

    const [loading, setLoading] = useState(true)
    const [validToken, setValidToken] = useState(false)
    const [password, setPassword] = useState("")
    const [serverChecksum, setServerChecksum] = useState(null)
    const [userChecksum, setUserChecksum] = useState("")
    const [error, setError] = useState(null)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (!token) {
            setLoading(false)
            setError("No token provided.")
            return
        }

        // Check if token exists
        axios.post(`${API_URL}/verify-token`, { token })
            .then(() => setValidToken(true))
            .catch(() => setError("Invalid or expired token."))
            .finally(() => setLoading(false))
    }, [token])

    const handleAuth = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            // Use the helper endpoint to verify password and get checksum
            const res = await axios.get(`${API_URL}/params`, {
                params: { token, password }
            })
            setServerChecksum(res.data.checksum)
        } catch (err) {
            setError("Incorrect password or server error.")
        }
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const response = await axios.post(`${API_URL}/download`, {
                token,
                password
            }, {
                responseType: 'blob' // Important for binary data
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            // Try to get filename from header or default
            const contentDisposition = response.headers['content-disposition']
            let fileName = 'secure-file'
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/)
                if (match && match[1]) fileName = match[1]
            }
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            setError("Download failed.")
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return <div className="text-center text-gray-400">Loading...</div>
    if (error) return <div className="text-center text-red-400">{error}</div>
    if (!validToken) return null

    if (!serverChecksum) {
        return (
            <div>
                <h2 className="text-xl font-semibold mb-6 text-center">Authentication Required</h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Enter File Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-600 transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 bg-primary rounded-lg font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                        Unlock File
                    </button>
                </form>
            </div>
        )
    }

    const checksumMatch = userChecksum && serverChecksum && userChecksum.trim() === serverChecksum

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold mb-2 text-center">Validation Success</h2>
            <p className="text-center text-gray-400 text-sm mb-6">File is ready for download.</p>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-6 space-y-4">
                <div>
                    <p className="text-xs text-secondary uppercase font-bold mb-1">Server Checksum (SHA-256)</p>
                    <p className="font-mono text-xs break-all text-gray-300">{serverChecksum}</p>
                </div>

                <div>
                    <label className="block text-xs text-secondary uppercase font-bold mb-1">Verify Checksum (Optional)</label>
                    <input
                        type="text"
                        value={userChecksum}
                        onChange={(e) => setUserChecksum(e.target.value)}
                        placeholder="Paste checksum from uploader..."
                        className={`w-full text-xs bg-black/20 border rounded p-2 focus:outline-none transition-colors ${userChecksum
                                ? (checksumMatch ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400")
                                : "border-gray-700 text-white"
                            }`}
                    />
                    {userChecksum && (
                        <p className={`text-xs mt-1 ${checksumMatch ? "text-green-500" : "text-red-500"}`}>
                            {checksumMatch ? "✓ Checksums match" : "⚠ Checksums do not match"}
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-2.5 bg-green-600 rounded-lg font-medium text-white shadow-lg shadow-green-600/20 hover:bg-green-500 hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all"
            >
                {downloading ? "Downloading..." : "Download File"}
            </button>
        </div>
    )
}

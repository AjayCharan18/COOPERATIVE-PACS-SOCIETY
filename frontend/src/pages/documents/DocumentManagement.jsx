import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
    DocumentArrowUpIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon
} from '@heroicons/react/24/outline'

export default function DocumentManagement() {
    const { loanId } = useParams()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [documentType, setDocumentType] = useState('aadhaar')

    useEffect(() => {
        if (loanId) {
            loadDocuments()
        }
    }, [loanId])

    const loadDocuments = async () => {
        try {
            const response = await api.get(`/documents/loan/${loanId}`)
            setDocuments(response.data.documents || [])
        } catch (error) {
            toast.error('Failed to load documents')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB')
                return
            }
            setSelectedFile(file)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file')
            return
        }

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('document_type', documentType)

        setUploading(true)
        try {
            await api.post(`/documents/upload/${loanId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            toast.success('Document uploaded successfully')
            setSelectedFile(null)
            loadDocuments()
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to upload document')
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    const handleVerify = async (documentId) => {
        try {
            await api.post(`/documents/verify/${documentId}`, {
                remarks: 'Document verified'
            })
            toast.success('Document verified successfully')
            loadDocuments()
        } catch (error) {
            toast.error('Failed to verify document')
            console.error(error)
        }
    }

    const documentTypes = [
        { value: 'aadhaar', label: 'Aadhaar Card' },
        { value: 'pan', label: 'PAN Card' },
        { value: 'land_records', label: 'Land Records' },
        { value: 'photo', label: 'Photograph' },
        { value: 'income_certificate', label: 'Income Certificate' },
        { value: 'caste_certificate', label: 'Caste Certificate' },
        { value: 'bank_statement', label: 'Bank Statement' },
        { value: 'other', label: 'Other' }
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Type
                        </label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {documentTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select File
                        </label>
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {selectedFile && (
                            <p className="text-xs text-gray-500 mt-1">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <DocumentArrowUpIcon className="h-5 w-5" />
                                    Upload
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, JPG, PNG, DOC, DOCX (Max size: 10MB)
                </p>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Document Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    File Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Size
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Upload Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900 capitalize">
                                                {doc.document_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {doc.filename}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {(doc.file_size / 1024).toFixed(2)} KB
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {doc.is_verified ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {!doc.is_verified && (
                                                <button
                                                    onClick={() => handleVerify(doc.id)}
                                                    className="text-green-600 hover:text-green-900 font-medium mr-3"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                        <p>No documents uploaded yet</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

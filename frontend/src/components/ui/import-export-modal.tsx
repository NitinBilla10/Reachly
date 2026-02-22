'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Download,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Info,
} from 'lucide-react'
import { customersAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface ColumnMapping {
  csvColumn: string
  dbField: string
  sample: string
}

interface ImportProgress {
  type: 'uploading' | 'processing' | 'completed' | 'failed'
  percentage: number
  message: string
  processed: number
  total: number
}

export default function ImportExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'import' | 'export'>('import')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([
    { csvColumn: 'name', dbField: 'name', sample: 'John Doe' },
    { csvColumn: 'phone', dbField: 'phone', sample: '+1 202 555 0123' },
    { csvColumn: 'email', dbField: 'email', sample: 'john@example.com' },
    { csvColumn: 'company', dbField: 'company', sample: 'Company Inc.' },
    { csvColumn: 'source', dbField: 'source', sample: 'website' },
    { csvColumn: 'gender', dbField: 'gender', sample: 'male' },
    { csvColumn: 'notes', dbField: 'notes', sample: 'Important notes' },
    { csvColumn: 'tags', dbField: 'tags', sample: 'VIP, Customer' },
    { csvColumn: 'optIn', dbField: 'optIn', sample: 'true' },
  ])
  const [exportFilters, setExportFilters] = useState({
    hasOptIn: false,
    hasOptOut: false,
    tagIds: [] as string[],
    dateRange: '30d' as '30d' | '90d' | 'all'
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportProgress(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file')
      return
    }

    setIsUploading(true)
    setImportProgress({
      type: 'uploading',
      percentage: 0,
      message: 'Uploading file...',
      processed: 0,
      total: 0
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setImportProgress({
          type: 'processing',
          percentage: 0,
          message: 'Processing import...',
          processed: 0,
          total: result.data.totalCustomers || 0
        })

        // Poll for progress updates
        const progressInterval = setInterval(async () => {
          try {
            const progressResponse = await fetch(`/api/customers/import/progress/${result.data.progressId}`)
            const progressData = await progressResponse.json()

            if (progressData.success && progressData.data.progress) {
              const progress = progressData.data.progress[0]

              setImportProgress({
                type: progress.percentage === 100 ? 'completed' : 'processing',
                percentage: progress.percentage,
                message: progress.percentage === 100
                  ? 'Import completed successfully!'
                  : `Processing... ${progress.percentage}%`,
                processed: progress.processed || 0,
                total: progress.total || 0
              })

              if (progress.percentage === 100) {
                clearInterval(progressInterval)
              }
            }
          } catch (error) {
            console.error('Error fetching progress:', error)
          }
        }, 1000)

        // Auto-stop after 5 minutes
        setTimeout(() => {
          clearInterval(progressInterval)
          setIsUploading(false)
        }, 5 * 60 * 1000)
      } else {
        throw new Error(result.error || 'Failed to upload file')
      }
    } catch (error: any) {
      console.error('Import error:', error)
      setImportProgress({
        type: 'failed',
        percentage: 0,
        message: error.message || 'Failed to import customers',
        processed: 0,
        total: 0
      })
      setIsUploading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      
      if (exportFilters.tagIds.length > 0) {
        params.append('ids', exportFilters.tagIds.join(','))
      }

      if (exportFilters.hasOptIn) {
        params.append('optIn', 'true')
      }

      if (exportFilters.hasOptOut) {
        params.append('optIn', 'false')
      }

      const response = await fetch(`/api/customers/export?${params.toString()}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export customers')
      }

      // Download the CSV file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success('Customers exported successfully!')
      onClose()
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export customers')
    }
  }

  const resetImport = () => {
    setFile(null)
    setImportProgress(null)
    setIsUploading(false)
  }

  const sampleCSV = `name,phone,email,company,source,gender,notes
John Doe,+1 202 555 0123,john@example.com,Acme Inc,website,male,VIP customer
Jane Smith,+1 555 0987,jane@company.com,Tech Corp,referral,female,Lead contact
Bob Johnson,+1 555 0198,bob@startup.io,Startup Labs,import,other,Potential client`

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers_sample.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleMappingChange = (index: number, field: string) => {
    const newMappings = [...columnMappings]
    newMappings[index].dbField = field
    setColumnMappings(newMappings)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Import / Export</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Import customers from CSV or export your contact list to CSV file.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              className={`pb-4 px-4 font-medium transition-colors ${
                tab === 'import'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('import')}
            >
              <Upload className="mr-2 h-4 w-4 inline" />
              Import
            </button>
            <button
              className={`pb-4 px-4 font-medium transition-colors ${
                tab === 'export'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('export')}
            >
              <Download className="mr-2 h-4 w-4 inline" />
              Export
            </button>
          </div>

          {/* Import Tab */}
          {tab === 'import' && (
            <div className="space-y-6">
              {/* CSV Format Info */}
              <div className="bg-muted/50 rounded-lg p-4 border">
                <h3 className="font-semibold mb-2 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Required CSV Format
                </h3>
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">Your CSV file must have the following columns:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li><code>name</code> - Customer's full name</li>
                    <li><code>phone</code> - Phone number with country code</li>
                    <li><code>email</code> - Email address (optional)</li>
                    <li><code>company</code> - Company name (optional)</li>
                    <li><code>source</code> - Lead source (optional)</li>
                    <li><code>gender</code> - Gender (optional)</li>
                    <li><code>notes</code> - Additional notes (optional)</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Download Sample CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    <Info className="mr-2 h-4 w-4" />
                    Format Guide
                  </Button>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  <FileSpreadsheet className="mr-2 h-5 w-5" />
                  Column Mapping
                </h4>
                <div className="text-sm text-muted-foreground mb-4">
                  Map your CSV columns to the database fields
                </div>

                <div className="space-y-3">
                  {columnMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">CSV Column:</p>
                        <Input
                          value={mapping.csvColumn}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                          placeholder={mapping.sample}
                          className="text-sm"
                        />
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Database Field:</p>
                        <Input
                          value={mapping.dbField}
                          className="text-sm bg-muted"
                          disabled
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          {mapping.dbField === 'name' && 'Required field'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload CSV File
                </h4>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className={`flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
                      file ? 'text-primary hover:text-primary/90' : 'text-muted-foreground'
                    } ${isUploading ? 'cursor-wait' : ''}`}
                  >
                    {file ? (
                      <FileText className="h-12 w-12 text-primary mb-2" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    )}
                    <span className="font-medium">
                      {file ? file.name : 'Choose CSV file'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {file ? `(${(file.size / 1024).toFixed(2)} KB)` : 'Max 10MB'}
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleImport}
                    disabled={!file || isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Customers
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetImport}
                    disabled={isUploading}
                  >
                    Reset
                  </Button>
                </div>

                {/* Progress Display */}
                {importProgress && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">
                        Import Progress
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {importProgress.processed} / {importProgress.total} contacts
                      </span>
                    </div>
                    <Progress
                      value={importProgress.percentage}
                      max={100}
                      color={
                        importProgress.type === 'completed' ? 'success' :
                        importProgress.type === 'failed' ? 'danger' :
                        'default'
                      }
                      showPercentage
                    />
                    {importProgress.message && (
                      <div className={`text-sm flex items-center gap-2 ${
                        importProgress.type === 'completed' ? 'text-green-600' :
                        importProgress.type === 'failed' ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        {importProgress.type === 'completed' && (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {importProgress.type === 'failed' && (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {importProgress.message}
                      </div>
                    )}

                    {importProgress.type === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImportProgress(null)
                          setIsUploading(false)
                        }}
                        className="w-full"
                      >
                        Import More Files
                      </Button>
                    )}

                    {importProgress.type === 'failed' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          Import Failed
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Please check your CSV file format and try again.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Tab */}
          {tab === 'export' && (
            <div className="space-y-6">
              {/* Export Filters */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  <Filter className="mr-2 h-5 w-5" />
                  Export Filters
                </h4>

                <div className="space-y-4">
                  {/* Opt-in Filter */}
                  <div className="flex gap-3">
                    <Button
                      variant={exportFilters.hasOptIn ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFilters({ ...exportFilters, hasOptIn: !exportFilters.hasOptIn })}
                    >
                      Opted In
                    </Button>
                    <Button
                      variant={exportFilters.hasOptOut ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFilters({ ...exportFilters, hasOptOut: !exportFilters.hasOptOut })}
                    >
                      Opted Out
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Filter customers by their marketing opt-in status
                  </p>
                </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={exportFilters.dateRange === '30d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExportFilters({ ...exportFilters, dateRange: '30d' })}
                      >
                        Last 30 Days
                      </Button>
                      <Button
                        variant={exportFilters.dateRange === '90d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExportFilters({ ...exportFilters, dateRange: '90d' })}
                      >
                        Last 90 Days
                      </Button>
                      <Button
                        variant={exportFilters.dateRange === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExportFilters({ ...exportFilters, dateRange: 'all' })}
                      >
                        All Time
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Export will include:</p>
                    <ul className="list-disc list-inside text-blue-800 mt-1 ml-4 space-y-1">
                      <li>All selected customers</li>
                      <li>Contact details (name, phone, email, etc.)</li>
                      <li>Tags (comma-separated list)</li>
                      <li>Contact type</li>
                      <li>Company and source information</li>
                      <li>Opt-in status</li>
                      <li>Gender</li>
                      <li>Notes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleExport}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Export Customers to CSV
                </Button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'

export default function HomePage() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [processingResult, setProcessingResult] = useState<any>(null)
  const [processingLoading, setProcessingLoading] = useState(false)
  const [selectedFileA, setSelectedFileA] = useState<File | null>(null) // On-model reference
  const [selectedFileB, setSelectedFileB] = useState<File | null>(null) // Detail source
  const [dragActiveA, setDragActiveA] = useState(false)
  const [dragActiveB, setDragActiveB] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ghost?action=health')
      const data = await response.json()
      setHealthStatus(data)
    } catch (error) {
      setHealthStatus({ error: 'Failed to check health' })
    }
    setLoading(false)
  }


  const handleFileSelect = (file: File, imageType: 'A' | 'B') => {
    if (file.type.startsWith('image/')) {
      if (imageType === 'A') {
        setSelectedFileA(file)
      } else {
        setSelectedFileB(file)
      }
      setProcessingResult(null)
    } else {
      alert('Please select an image file')
    }
  }

  const handleDrag = (e: React.DragEvent, imageType: 'A' | 'B') => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (imageType === 'A') {
        setDragActiveA(true)
      } else {
        setDragActiveB(true)
      }
    } else if (e.type === 'dragleave') {
      if (imageType === 'A') {
        setDragActiveA(false)
      } else {
        setDragActiveB(false)
      }
    }
  }

  const handleDrop = (e: React.DragEvent, imageType: 'A' | 'B') => {
    e.preventDefault()
    e.stopPropagation()
    if (imageType === 'A') {
      setDragActiveA(false)
    } else {
      setDragActiveB(false)
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], imageType)
    }
  }

  const processImage = async () => {
    if (!selectedFileB) {
      alert('Please select at least Image B (Detail Source)')
      return
    }
    
    setProcessingLoading(true)
    setProcessingResult(null)
    setProcessingStatus('Preparing images...')
    
    try {
      // Convert Image B (Detail Source) to base64
      setProcessingStatus('Converting images...')
      const base64B = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(selectedFileB)
      })
      
      // Convert Image A (On-Model Reference) to base64 if provided
      let base64A = undefined
      if (selectedFileA) {
        base64A = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(selectedFileA)
        })
      }
      
      // Send to API - Note: flatlay is the detail source (Image B), onModel is the reference (Image A)
      setProcessingStatus('Processing images through AI pipeline...')
      const response = await fetch('/api/ghost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flatlay: base64B,    // Image B - Detail Source (primary)
          onModel: base64A,    // Image A - On-Model Reference (optional)
          options: {
            outputSize: '2048x2048',
            backgroundColor: 'white'
          }
        })
      })
      
      const result = await response.json()
      setProcessingResult(result)
      
    } catch (error) {
      setProcessingResult({ 
        error: 'Processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
    
    setProcessingLoading(false)
    setProcessingStatus('')
  }

  const testWithSampleImage = async () => {
    setProcessingLoading(true)
    setProcessingResult(null)
    setProcessingStatus('Testing with sample images...')
    
    try {
      const response = await fetch('/api/ghost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flatlay: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&crop=center",  // Detail source
          onModel: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop&crop=center", // On-model reference
          options: {
            outputSize: '2048x2048',
            backgroundColor: 'white'
          }
        })
      })
      
      const result = await response.json()
      setProcessingResult(result)
      
    } catch (error) {
      setProcessingResult({ 
        error: 'Processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
    
    setProcessingLoading(false)
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      lineHeight: '1.6'
    }}>
      <h1 style={{ color: '#333', marginBottom: '1rem' }}>
        🎭 Ghost Mannequin Pipeline API
      </h1>
      
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
        AI-powered transformation of flatlay product photos into professional ghost mannequin images.
      </p>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>API Health Check</h2>
        <button 
          onClick={checkHealth}
          disabled={loading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {loading ? 'Checking...' : 'Check API Health'}
        </button>
        
        {healthStatus && (
          <pre style={{ 
            backgroundColor: '#fff', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.9rem'
          }}>
            {JSON.stringify(healthStatus, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#333' }}>🔄 Enhanced Pipeline Stages</h2>
        <ol style={{ color: '#666' }}>
          <li><strong>Background Removal</strong> - FAL.AI Bria 2.0 removes backgrounds from flatlay images</li>
          <li><strong>Professional Garment Analysis</strong> - Gemini 2.5 Pro performs comprehensive analysis:
            <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <li>🏷️ <strong>Label Detection:</strong> Brand tags, size labels, care instructions with OCR and spatial coordinates</li>
              <li>🎯 <strong>Detail Preservation:</strong> Logos, stitching, hardware with priority classification</li>
              <li>🔍 <strong>Construction Analysis:</strong> Seams, drape, silhouette rules for structural integrity</li>
              <li>📐 <strong>Spatial Mapping:</strong> Normalized bounding boxes, orientations, and color sampling</li>
            </ul>
          </li>
          <li><strong>Ghost Mannequin Generation</strong> - Gemini 2.5 Flash creates the final ghost mannequin effect using detailed analysis data</li>
        </ol>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#333' }}>🔗 API Endpoints</h2>
        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Health Check:</strong>
            <code style={{ 
              backgroundColor: '#e9ecef', 
              padding: '0.2rem 0.4rem', 
              borderRadius: '3px',
              marginLeft: '0.5rem'
            }}>
              GET /api/ghost?action=health
            </code>
          </div>
          
          <div>
            <strong>Process Image:</strong>
            <code style={{ 
              backgroundColor: '#e9ecef', 
              padding: '0.2rem 0.4rem', 
              borderRadius: '3px',
              marginLeft: '0.5rem'
            }}>
              POST /api/ghost
            </code>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>🖼️ Test Ghost Mannequin Pipeline</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Image A - On-Model Reference (Optional) */}
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1rem' }}>
              👤 Image A - On-Model Reference
              <span style={{ color: '#999', fontWeight: 'normal', fontSize: '0.85rem' }}> (Optional)</span>
            </h3>
            <div 
              style={{
                border: dragActiveA ? '2px dashed #007bff' : '2px dashed #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: dragActiveA ? '#f0f8ff' : '#fff',
                cursor: 'pointer',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
              onDragEnter={(e) => handleDrag(e, 'A')}
              onDragLeave={(e) => handleDrag(e, 'A')}
              onDragOver={(e) => handleDrag(e, 'A')}
              onDrop={(e) => handleDrop(e, 'A')}
              onClick={() => document.getElementById('fileInputA')?.click()}
            >
              <input
                id="fileInputA"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'A')}
              />
              
              {selectedFileA ? (
                <div>
                  <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    ✓ {selectedFileA.name}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.8rem' }}>
                    {(selectedFileA.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    📁 Drag & drop or click
                  </p>
                  <p style={{ color: '#999', fontSize: '0.8rem' }}>
                    Supports JPEG, PNG, WebP
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Image B - Detail Source (Required) */}
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1rem' }}>
              🔍 Image B - Detail Source
              <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.85rem' }}> (Required)</span>
            </h3>
            <div 
              style={{
                border: dragActiveB ? '2px dashed #007bff' : selectedFileB ? '2px dashed #28a745' : '2px dashed #e74c3c',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: dragActiveB ? '#f0f8ff' : '#fff',
                cursor: 'pointer',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
              onDragEnter={(e) => handleDrag(e, 'B')}
              onDragLeave={(e) => handleDrag(e, 'B')}
              onDragOver={(e) => handleDrag(e, 'B')}
              onDrop={(e) => handleDrop(e, 'B')}
              onClick={() => document.getElementById('fileInputB')?.click()}
            >
              <input
                id="fileInputB"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'B')}
              />
              
              {selectedFileB ? (
                <div>
                  <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    ✓ {selectedFileB.name}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.8rem' }}>
                    {(selectedFileB.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    📁 Drag & drop or click
                  </p>
                  <p style={{ color: '#999', fontSize: '0.8rem' }}>
                    Colors, patterns, details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <strong>📝 Image Roles:</strong><br/>
          <strong>Image A</strong> - On-model reference for proportions and spatial relationships (optional)<br/>
          <strong>Image B</strong> - Detail source with absolute truth for colors, patterns, textures (required)
        </div>
        
        {/* Process Button */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={processImage}
            disabled={!selectedFileB || processingLoading}
            style={{
              backgroundColor: selectedFileB ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: selectedFileB ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            {processingLoading ? '🔄 Processing...' : '🚀 Generate Ghost Mannequin'}
          </button>
          
          <button
            onClick={testWithSampleImage}
            disabled={processingLoading}
            style={{
              backgroundColor: processingLoading ? '#ccc' : '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: processingLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            🧪 Test with Sample Image
          </button>
        </div>
        
        {/* Processing Status */}
        {processingStatus && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: 0, color: '#856404', fontWeight: 'bold' }}>
              🔄 {processingStatus}
            </p>
          </div>
        )}
        
        {/* Processing Result */}
        {processingResult && (
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginTop: '1rem'
          }}>
            {processingResult.status === 'completed' ? (
              <div>
                <h3 style={{ marginTop: 0, color: '#28a745', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✅ Ghost Mannequin Generated Successfully!
                </h3>
                
                {/* Final Ghost Mannequin Image */}
                {processingResult.renderUrl && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: '#333', marginBottom: '1rem' }}>🎭 Final Ghost Mannequin Image:</h4>
                    <div style={{
                      border: '2px solid #28a745',
                      borderRadius: '8px',
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      textAlign: 'center'
                    }}>
                      <img 
                        src={processingResult.renderUrl} 
                        alt="Ghost Mannequin Result"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          borderRadius: '4px',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', processingResult.renderUrl)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div style={{ marginTop: '0.5rem' }}>
                        <a 
                          href={processingResult.renderUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#007bff',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}
                        >
                          🔗 Open Full Size
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Processing Metrics */}
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>⏱️ Processing Metrics:</h4>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Total Time:</strong> {processingResult.metrics?.processingTime || 'N/A'}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Session ID:</strong> <code style={{ backgroundColor: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>{processingResult.sessionId}</code>
                    </p>
                    {processingResult.metrics?.stageTimings && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Stage Timings:</strong>
                        <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                          <li>Background Removal: {(processingResult.metrics.stageTimings.backgroundRemoval / 1000).toFixed(1)}s</li>
                          <li>Garment Analysis: {(processingResult.metrics.stageTimings.analysis / 1000).toFixed(1)}s</li>
                          <li>Ghost Mannequin Generation: {(processingResult.metrics.stageTimings.rendering / 1000).toFixed(1)}s</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Cleaned Images */}
                {(processingResult.cleanedOnModelUrl || processingResult.cleanedImageUrl) && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#333', marginBottom: '1rem' }}>🖼️ Intermediate Results:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {processingResult.cleanedOnModelUrl && (
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>On-Model (Background Removed)</p>
                          <img 
                            src={processingResult.cleanedOnModelUrl} 
                            alt="Cleaned On-Model Image"
                            style={{
                              width: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      )}
                      {processingResult.cleanedImageUrl && (
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Garment Detail (Background Removed)</p>
                          <img 
                            src={processingResult.cleanedImageUrl} 
                            alt="Cleaned Garment Detail Image"
                            style={{
                              width: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Analysis Summary */}
                {processingResult.analysis && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>🔍 Garment Analysis Summary:</h4>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {processingResult.analysis.labels_found && (
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Labels Detected:</strong> {processingResult.analysis.labels_found.length} labels found
                        </p>
                      )}
                      {processingResult.analysis.preserve_details && (
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Details to Preserve:</strong> {processingResult.analysis.preserve_details.length} elements identified
                        </p>
                      )}
                      {processingResult.analysis.construction_details && (
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Construction Features:</strong> {processingResult.analysis.construction_details.length} features analyzed
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : processingResult.status === 'failed' ? (
              <div>
                <h3 style={{ marginTop: 0, color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ❌ Processing Failed
                </h3>
                
                <div style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#721c24' }}>
                    Error: {processingResult.error?.message || 'Unknown error'}
                  </p>
                  {processingResult.error?.stage && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>
                      Failed at stage: <strong>{processingResult.error.stage}</strong>
                    </p>
                  )}
                  {processingResult.error?.code && (
                    <p style={{ margin: '0', color: '#721c24', fontSize: '0.9rem' }}>
                      Error Code: <code>{processingResult.error.code}</code>
                    </p>
                  )}
                </div>
                
                {/* Show partial results if available */}
                {(processingResult.cleanedOnModelUrl || processingResult.cleanedImageUrl) && (
                  <div>
                    <h4 style={{ color: '#333', marginBottom: '1rem' }}>🖼️ Partial Results (Before Failure):</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {processingResult.cleanedOnModelUrl && (
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>On-Model (Background Removed)</p>
                          <img 
                            src={processingResult.cleanedOnModelUrl} 
                            alt="Cleaned On-Model Image"
                            style={{
                              width: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      )}
                      {processingResult.cleanedImageUrl && (
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Garment Detail (Background Removed)</p>
                          <img 
                            src={processingResult.cleanedImageUrl} 
                            alt="Cleaned Garment Detail Image"
                            style={{
                              width: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ marginTop: 0, color: '#ffc107' }}>⏳ Processing...</h3>
                <p>Status: {processingResult.status}</p>
              </div>
            )}
            
            {/* Raw JSON Toggle */}
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#666', fontSize: '0.9rem' }}>
                🔧 Show Raw JSON Response
              </summary>
              <pre style={{ 
                overflow: 'auto',
                fontSize: '0.8rem',
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                marginTop: '0.5rem'
              }}>
                {JSON.stringify(processingResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#333' }}>📝 Example Request</h2>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.85rem'
        }}>
{`curl -X POST http://localhost:3000/api/ghost \\
  -H "Content-Type: application/json" \\
  -d '{
    "flatlay": "data:image/jpeg;base64,...",
    "options": {
      "outputSize": "2048x2048",
      "backgroundColor": "white"
    }
  }'`}
        </pre>
      </div>

      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '1rem', 
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <strong>Development Mode:</strong> API logging is enabled. Check your terminal for detailed pipeline execution logs.
      </div>
    </div>
  )
}

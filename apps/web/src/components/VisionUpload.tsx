import React, { useState } from 'react';
import { Camera, Upload, Eye, FileText, CheckCircle } from 'lucide-react';

interface VisionUploadProps {
  onAnalyze: (description: string) => void;
  onClose: () => void;
}

export const VisionUpload: React.FC<VisionUploadProps> = ({ onAnalyze, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAnalyzeDocument = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onAnalyze(
        selectedFile
          ? `Uploaded document "${selectedFile.name}" analyzed. Discharge Summary from Apollo Hospital: Take prescribed medication twice daily after food.`
          : 'Uploaded document discharge summary analyzed: Take prescribed medication twice daily after food.'
      );
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 20px 50px rgba(16, 185, 129, 0.2)' }}>
        <div className="modal-header" style={{ color: '#10b981' }}>
          <Eye size={28} />
          <span>Multimodal Vision & Document OCR</span>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Upload or snapshot a document (medical prescription, bill, official notice) for simplified voice explanation.
        </p>

        <div
          style={{
            border: '2px dashed rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '2rem 1rem',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {previewUrl ? (
            <div>
              <img
                src={previewUrl}
                alt="Document Preview"
                style={{ maxHeight: '180px', borderRadius: '12px', marginBottom: '0.5rem', objectFit: 'contain' }}
              />
              <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {selectedFile?.name}
              </div>
            </div>
          ) : (
            <div>
              <Upload size={36} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600 }}>
                Click or Drag Document Image Here
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Supports JPG, PNG, PDF receipts or camera snapshots
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="vision-file-input"
          />
          <label htmlFor="vision-file-input" style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-decline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-authorize"
            onClick={handleAnalyzeDocument}
            disabled={isProcessing}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
          >
            {isProcessing ? (
              <span>Processing Vision Model...</span>
            ) : (
              <>
                <Camera size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Analyze & Read Out Loud
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

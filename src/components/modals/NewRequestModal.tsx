import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewRequestModal({ isOpen, onClose }: NewRequestModalProps) {
  const { addRequest } = useApp();
  const [activeTab, setActiveTab] = useState<'upload' | 'ai'>('ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [generatedMemo, setGeneratedMemo] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    quantity: 1,
    model: '',
    price: 0,
    department: '',
  });

  const handleGenerateMemo = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const memo = `TO: Procurement Department
FROM: ${formData.department || 'Department Head'}
DATE: ${new Date().toLocaleDateString()}
SUBJECT: Request for ${formData.subject || formData.title}

This memo serves as a formal request for the procurement of the following item(s):

Item: ${formData.subject || formData.title}
${formData.model ? `Model/Specification: ${formData.model}` : ''}
Quantity: ${formData.quantity}
Estimated Unit Price: $${formData.price.toLocaleString()}
Total Estimated Cost: $${(formData.price * formData.quantity).toLocaleString()}

JUSTIFICATION:
This procurement is essential for maintaining operational efficiency within our department. The requested item(s) will directly contribute to improving productivity and meeting our departmental objectives for the current fiscal year.

The current market conditions suggest this is an appropriate time for this acquisition, and the selected specifications meet our technical requirements while providing the best value for the organization.

BUDGET ALLOCATION:
This expense will be allocated to the departmental operational budget (OPEX-2024).

Respectfully submitted for your review and approval.`;

    setGeneratedMemo(memo);
    setIsGenerating(false);
  };

  const handleSubmit = () => {
    addRequest({
      title: formData.title || formData.subject,
      description: formData.description || `Request for ${formData.subject}`,
      quantity: formData.quantity,
      model: formData.model,
      price: formData.price,
      status: 'PENDING_PROCUREMENT',
      requester: 'Current User',
      department: formData.department || 'General',
      memo: generatedMemo || undefined,
      memoFile: uploadedFile || undefined,
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      subject: '',
      quantity: 1,
      model: '',
      price: 0,
      department: '',
    });
    setGeneratedMemo(null);
    setUploadedFile(null);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-display text-xl font-semibold text-foreground">
              New Procurement Request
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Request Title
                </label>
                <Input
                  placeholder="e.g., MacBook Pro for Development Team"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Department
                  </label>
                  <Input
                    placeholder="e.g., Engineering"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="font-body"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Estimated Price ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="font-body"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Description
                </label>
                <Textarea
                  placeholder="Brief description of the request..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="font-body resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Memo Tabs */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-4 py-3 font-body text-sm font-medium transition-colors ${
                    activeTab === 'ai'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="inline-block h-4 w-4 mr-2" />
                  AI Generator
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 px-4 py-3 font-body text-sm font-medium transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="inline-block h-4 w-4 mr-2" />
                  Manual Upload
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'ai' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                          Subject
                        </label>
                        <Input
                          placeholder="Item subject"
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                          className="font-body"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantity: Number(e.target.value),
                            })
                          }
                          className="font-body"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                        Model/Specification (Optional)
                      </label>
                      <Input
                        placeholder="e.g., M3 Max 64GB"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        className="font-body"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateMemo}
                      disabled={isGenerating || !formData.subject}
                      className="w-full font-body"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Memo
                        </>
                      )}
                    </Button>

                    {generatedMemo && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-secondary/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Generated Memo
                          </span>
                        </div>
                        <pre className="font-body text-sm text-foreground whitespace-pre-wrap">
                          {generatedMemo}
                        </pre>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors"
                  >
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-success" />
                        <span className="font-body text-sm text-foreground">
                          {uploadedFile}
                        </span>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="font-body text-sm text-muted-foreground mb-2">
                          Drag and drop your memo PDF here
                        </p>
                        <label className="cursor-pointer">
                          <span className="font-body text-sm text-foreground underline">
                            or click to browse
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileInput}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="font-body">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title && !formData.subject}
              className="font-body"
            >
              Submit Request
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

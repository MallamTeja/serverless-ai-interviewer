import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Upload, FileCheck, Trash2 } from 'lucide-react';
import { parseResume } from '@/utils/fileParser';
import { updateCandidateFields } from '@/store/candidateSlice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ResumeUploadProps {
  /**
   * Callback when resume is successfully processed
   */
  onResumeProcessed?: () => void;
  
  /**
   * Maximum allowed file size in MB
   */
  maxSizeMB?: number;
}

/**
 * Component for handling resume upload and processing
 */
const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onResumeProcessed,
  maxSizeMB = 5
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Allowed file types
  const allowedTypes = [
    'application/pdf',                                                     // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  ];
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF or DOCX file.');
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }
    
    setFile(selectedFile);
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
  };
  
  // Process the uploaded resume
  const handleProcessResume = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 15);
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);
      
      // Parse resume file
      const resumeData = await parseResume(file);
      
      // Clear the interval and complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update store with extracted data
      dispatch(updateCandidateFields({
        name: resumeData.name || '',
        email: resumeData.email || '',
        phone: resumeData.phone || '',
        resumeFileName: file.name,
      }));
      
      toast({
        title: 'Resume processed successfully',
        description: 'Your information has been extracted.',
        duration: 3000,
      });
      
      // Notify parent component
      if (onResumeProcessed) {
        onResumeProcessed();
      }
    } catch (err) {
      setError('Failed to process resume. Please try again.');
      console.error('Resume processing error:', err);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Upload Your Resume</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!file ? (
          <div 
            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('resume-upload')?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground/70">
              PDF (required) or DOCX (optional)
            </p>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-md">
              <FileCheck className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFile}
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress === 100 ? 'Processing complete!' : 'Processing resume...'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleProcessResume}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Processing...' : 'Process Resume'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;

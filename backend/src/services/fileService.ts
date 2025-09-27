import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { ResumeData, FileUploadResult } from '../models/candidateModel.js';

export class FileService {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  private readonly maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

  async parseResume(filePath: string, originalName: string, mimeType: string): Promise<FileUploadResult> {
    try {
      // Validate file type
      if (!this.allowedMimeTypes.includes(mimeType)) {
        return {
          success: false,
          error: 'Invalid file type. Only PDF and DOCX files are allowed.',
        };
      }

      // Validate file size
      const stats = await fs.promises.stat(filePath);
      if (stats.size > this.maxFileSize) {
        return {
          success: false,
          error: `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB.`,
        };
      }

      let rawText: string;

      // Parse based on file type
      if (mimeType === 'application/pdf') {
        rawText = await this.parsePDF(filePath);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        rawText = await this.parseDocx(filePath);
      } else {
        return {
          success: false,
          error: 'Unsupported file format.',
        };
      }

      // Extract structured data from raw text
      const resumeData = this.extractResumeData(rawText);

      // Validate extracted data
      const validationError = this.validateResumeData(resumeData);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      return {
        success: true,
        data: resumeData,
        fileName: originalName,
        fileSize: stats.size,
      };

    } catch (error) {
      console.error('Error parsing resume:', error);
      return {
        success: false,
        error: 'Failed to parse resume. The file may be corrupted or in an unsupported format.',
      };
    }
  }

  private async parsePDF(filePath: string): Promise<string> {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const data = await pdfParse(buffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
    }
  }

  private async parseDocx(filePath: string): Promise<string> {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text content found in DOCX');
      }
      
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file. The file may be corrupted.');
    }
  }

  private extractResumeData(rawText: string): ResumeData {
    const text = rawText.toLowerCase();
    
    // Extract name (first line typically contains name)
    const lines = rawText.split('\n').filter(line => line.trim().length > 0);
    const name = this.extractName(lines[0] || '');

    // Extract email
    const email = this.extractEmail(rawText);

    // Extract phone
    const phone = this.extractPhone(rawText);

    // Extract experience section
    const experience = this.extractSection(rawText, ['experience', 'work history', 'employment']);

    // Extract education section
    const education = this.extractSection(rawText, ['education', 'academic', 'degree']);

    // Extract skills
    const skills = this.extractSkills(rawText);

    return {
      name,
      email,
      phone,
      experience,
      education,
      skills,
      rawText
    };
  }

  private extractName(firstLine: string): string {
    // Clean up the first line and extract potential name
    const cleaned = firstLine
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If line is too long or contains common resume words, it's probably not just a name
    if (cleaned.length > 50 || 
        /\b(resume|cv|curriculum|vitae|address|email|phone)\b/i.test(cleaned)) {
      return 'Name not found';
    }
    
    return cleaned || 'Name not found';
  }

  private extractEmail(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : 'Email not found';
  }

  private extractPhone(text: string): string {
    // Various phone number formats
    const phoneRegexes = [
      /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      /\b(?:\+?1[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g
    ];

    for (const regex of phoneRegexes) {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        return matches[0].trim();
      }
    }

    return 'Phone not found';
  }

  private extractSection(text: string, sectionHeaders: string[]): string {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = lines.length;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (sectionHeaders.some(header => line.includes(header))) {
        sectionStart = i;
        break;
      }
    }

    if (sectionStart === -1) {
      return 'Section not found';
    }

    // Find section end (next major section)
    const nextSectionHeaders = [
      'experience', 'education', 'skills', 'projects', 'certifications',
      'achievements', 'references', 'objective', 'summary'
    ];

    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (nextSectionHeaders.some(header => 
        line.includes(header) && !sectionHeaders.some(sh => line.includes(sh))
      )) {
        sectionEnd = i;
        break;
      }
    }

    return lines.slice(sectionStart, sectionEnd).join('\n').trim() || 'Section content not found';
  }

  private extractSkills(text: string): string[] {
    const skillsSection = this.extractSection(text, ['skills', 'technical skills', 'technologies']);
    
    if (skillsSection === 'Section not found' || skillsSection === 'Section content not found') {
      return [];
    }

    // Common technical skills to look for
    const commonSkills = [
      'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
      'html', 'css', 'sass', 'typescript', 'sql', 'mongodb', 'postgresql',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'jenkins', 'terraform'
    ];

    const foundSkills: string[] = [];
    const lowerText = skillsSection.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill)) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  private validateResumeData(data: ResumeData): string | null {
    if (data.name === 'Name not found' && 
        data.email === 'Email not found' && 
        data.phone === 'Phone not found') {
      return 'Unable to extract basic information (name, email, or phone) from the resume. Please ensure the file is readable and contains contact information.';
    }

    if (data.email !== 'Email not found') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return 'Invalid email format detected in resume.';
      }
    }

    return null; // No validation errors
  }

  async validateFile(filePath: string, mimeType: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'File not found' };
      }

      // Check file type
      if (!this.allowedMimeTypes.includes(mimeType)) {
        return { valid: false, error: 'Invalid file type' };
      }

      // Check file size
      const stats = await fs.promises.stat(filePath);
      if (stats.size > this.maxFileSize) {
        return { valid: false, error: 'File too large' };
      }

      // Try to read a small portion to check if file is readable
      const buffer = Buffer.alloc(1024);
      const fd = await fs.promises.open(filePath, 'r');
      await fd.read(buffer, 0, 1024, 0);
      await fd.close();

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'File is corrupted or unreadable' };
    }
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  generateUploadPath(): string {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return path.join(uploadDir, `${timestamp}-${random}`);
  }

  async ensureUploadDirectory(): Promise<void> {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadDir)) {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }
  }
}

export const fileService = new FileService();
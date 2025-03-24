'use client';

import React, { useState, useEffect } from 'react';
import { Resume } from './Resume';
import { TemplateDownload } from './TemplateDownload';
import { parseContent, FileFormat } from '../lib/parser';
import type { Resume as ResumeType } from '../types/Resume';
import { Upload, AlertCircle, Check, FileText } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { parseMarkdown } from '@/lib/parsers/markdown';
import { parseYaml } from '@/lib/parsers/yaml';
import { parsePlainText } from '@/lib/parsers/plaintext';
import { parseJson } from '@/lib/parsers/json';

const STORAGE_KEY = 'savedResume';

export const Home: React.FC = () => {
  const [resume, setResume] = useState<ResumeType | null>(null);
  const [error, setError] = useState<string>('');
  const [rememberFile, setRememberFile] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [sourceFile, setSourceFile] = useState<string>('');
  const [fileMetadata, setFileMetadata] = useState<{
    lastModified?: Date;
    fromLocalStorage?: boolean;
  }>({});
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Helper function to parse resume text based on file extension
  const parseResumeText = async (text: string, fileExtension: string) => {
    switch (fileExtension) {
      case 'md':
        return parseMarkdown(text);
      case 'yml':
      case 'yaml':
        return parseYaml(text);
      case 'txt':
        return parsePlainText(text);
      case 'json':
        return parseJson(text);
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  };

  // Function to load the default resume
  const loadDefaultResume = async () => {
    try {
      // Get the default resume path from environment variable or use fallback
      const defaultResumePath = process.env.NEXT_PUBLIC_DEFAULT_RESUME_PATH || '/default-resume.md';

      // Set a user-friendly display name for the default file
      setSourceFile('Default Resume');
      // Clear file metadata for default resume
      setFileMetadata({});
      // Clear original file name
      setOriginalFileName('');

      const response = await fetch(defaultResumePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Determine the parser to use based on the file extension
      const fileExtension = defaultResumePath.split('.').pop()?.toLowerCase() || 'json';
      let data;

      if (fileExtension === 'json') {
        data = await response.json();
      } else {
        const text = await response.text();
        data = await parseResumeText(text, fileExtension);
      }

      setResume(data);
      return true;
    } catch (err) {
      console.error('Error loading default resume:', err);
      setError('Failed to load default resume. Please try uploading your own file.');
      return false;
    }
  };

  // Reset function to clear state and load default resume
  const resetToDefault = async () => {
    // Clear any saved resume in localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_timestamp');
    localStorage.removeItem(STORAGE_KEY + '_filename');

    // Load the default resume
    await loadDefaultResume();
  };

  useEffect(() => {
    const loadSavedResume = async () => {
      const savedResume = localStorage.getItem(STORAGE_KEY);
      if (savedResume) {
        try {
          setResume(JSON.parse(savedResume));

          // Get original filename if available
          const filename = localStorage.getItem(STORAGE_KEY + '_filename');
          if (filename) {
            setSourceFile(filename);
            setOriginalFileName(filename);
          } else {
            setSourceFile('Saved resume');
          }

          // Set a flag indicating this is from localStorage
          setFileMetadata((prev) => ({
            ...prev,
            fromLocalStorage: true,
            lastModified: undefined,
          }));

          // Set last modified date from localStorage if available
          const lastSaved = localStorage.getItem(STORAGE_KEY + '_timestamp');
          if (lastSaved) {
            setFileMetadata((prev) => ({
              ...prev,
              lastModified: new Date(parseInt(lastSaved)),
            }));
          }

          return true;
        } catch (err) {
          console.error('Error loading saved resume:', err);
          localStorage.removeItem(STORAGE_KEY);
          return false;
        }
      }
      return false;
    };

    const init = async () => {
      const hasSavedResume = await loadSavedResume();
      if (!hasSavedResume) {
        // Load default resume if no saved resume
        await loadDefaultResume();
      }
    };

    init();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the selected file temporarily without processing it yet
    setSelectedFile(file);
    setError(''); // Clear any previous errors
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    try {
      const content = await selectedFile.text();
      let format: FileFormat;

      if (selectedFile.name.endsWith('.json')) {
        format = 'json';
      } else if (selectedFile.name.endsWith('.yml') || selectedFile.name.endsWith('.yaml')) {
        format = 'yaml';
      } else if (selectedFile.name.endsWith('.md')) {
        format = 'md';
      } else {
        format = 'txt';
      }

      setSourceFile(selectedFile.name);
      setOriginalFileName(selectedFile.name); // Store original file name

      // Parse the resume content
      const parsedResume = parseContent(content, format);
      setResume(parsedResume);
      setError('');

      // Get current timestamp for upload time
      const currentTime = new Date();

      // Set file metadata based on whether we're remembering the file
      if (rememberFile) {
        setFileMetadata({
          lastModified: currentTime,
          fromLocalStorage: true,
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedResume));
        // Store timestamp in milliseconds
        localStorage.setItem(STORAGE_KEY + '_timestamp', currentTime.getTime().toString());
        // Store original filename
        localStorage.setItem(STORAGE_KEY + '_filename', selectedFile.name);
      } else {
        setFileMetadata({
          lastModified: currentTime,
          fromLocalStorage: false,
        });

        // Clear any saved resume data if not remembering this file
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY + '_timestamp');
        localStorage.removeItem(STORAGE_KEY + '_filename');
      }

      // Clear the selected file after processing
      setSelectedFile(null);
    } catch (err) {
      setError('Error parsing resume file. Please check the format and try again.');
      console.error('Error reading file:', err);
    }
  };

  // Function to trigger file reloading
  const reloadFile = () => {
    // Create a temporary file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.yml,.yaml,.md,.txt';

    // Trigger the file dialog when this input changes
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFileSelect({ target } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    // Trigger the file dialog
    input.click();
  };

  if (resume) {
    return (
      <Resume
        resume={resume}
        onBack={() => setResume(null)}
        sourceFile={sourceFile}
        fileMetadata={fileMetadata}
        onReload={reloadFile}
        originalFileName={originalFileName}
        onReset={resetToDefault}
      />
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="navbar bg-base-100 mb-6">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Resume Builder</a>
        </div>
        <div className="flex-none">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="card w-full max-w-3xl mx-auto">
        <div className="card-body">
          <div className="tabs tabs-boxed mb-6">
            <a
              className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Resume
            </a>
            <a
              className={`tab ${activeTab === 'templates' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              Get Template
            </a>
          </div>

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="card bg-base-200">
                <div className="card-body text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Upload Resume</h3>
                  <p className="mb-2">Select your resume file to get started</p>
                  <p className="text-sm text-base-content/70 mb-6">
                    Supported formats: JSON, YAML, Markdown, Plain Text
                  </p>

                  {!selectedFile ? (
                    <>
                      <input
                        type="file"
                        accept=".json,.yml,.yaml,.md,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="btn btn-primary">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </label>
                      <div className="alert alert-info mt-6">
                        <span>
                          Note: Your resume format should follow one of our templates for best
                          results.
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 bg-base-100 p-3 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>

                      <div className="form-control">
                        <label className="label cursor-pointer justify-center">
                          <span className="label-text mr-2">Remember this file for next time</span>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={rememberFile}
                            onChange={(e) => setRememberFile(e.target.checked)}
                          />
                        </label>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Cancel
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={handleConfirmUpload}>
                          <Check className="w-4 h-4 mr-2" />
                          Confirm Upload
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <AlertCircle className="w-6 h-6" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && <TemplateDownload />}
        </div>
      </div>
    </div>
  );
};

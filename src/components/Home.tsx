'use client';

import React, { useState, useEffect } from 'react';
import { Resume } from './Resume';
import { TemplateDownload } from './TemplateDownload';
import { parseContent, FileFormat } from '../lib/parser';
import type { Resume as ResumeType } from '../types/Resume';
import { Upload, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    const loadSavedResume = async () => {
      const savedResume = localStorage.getItem(STORAGE_KEY);
      if (savedResume) {
        try {
          setResume(JSON.parse(savedResume));
          return true;
        } catch (err) {
          console.error('Error loading saved resume:', err);
          localStorage.removeItem(STORAGE_KEY);
          return false;
        }
      }
      return false;
    };

    const loadDefaultResume = async () => {
      try {
        // Get the default resume path from environment variable or use fallback
        const defaultResumePath =
          process.env.NEXT_PUBLIC_DEFAULT_RESUME_PATH || '/templates/resume.json';

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

        console.log('Parsed resume:', JSON.stringify(data, null, 2));

        setResume(data);
      } catch (err) {
        console.error('Error loading default resume:', err);
        setError('Failed to load default resume. Please try uploading your own file.');
      }
    };

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

    const init = async () => {
      const hasSavedResume = await loadSavedResume();
      if (!hasSavedResume) {
        // Load default resume if no saved resume
        await loadDefaultResume();
      }
    };

    init();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      let format: FileFormat;

      if (file.name.endsWith('.json')) {
        format = 'json';
      } else if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
        format = 'yaml';
      } else if (file.name.endsWith('.md')) {
        format = 'md';
      } else {
        format = 'txt';
      }

      const parsedResume = parseContent(content, format);
      setResume(parsedResume);
      setError('');

      if (rememberFile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedResume));
      }
    } catch (error) {
      setError('Error parsing resume file. Please check the format and try again.');
      console.error('Error reading file:', error);
    }
  };

  if (resume) {
    return <Resume resume={resume} onBack={() => setResume(null)} />;
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
                  <p className="mb-6">Select your resume file to get started</p>
                  <input
                    type="file"
                    accept=".json,.yml,.yaml,.md,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="btn btn-primary">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                  <div className="form-control mt-4">
                    <label className="label cursor-pointer justify-center">
                      <span className="label-text mr-2">Remember this file</span>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={rememberFile}
                        onChange={(e) => setRememberFile(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <AlertCircle className="w-6 h-6" />
                  <span>{error}</span>
                </div>
              )}

              <div className="alert alert-info">
                <span>Supported formats: JSON, YAML, Markdown, Plain Text</span>
              </div>
            </div>
          )}

          {activeTab === 'templates' && <TemplateDownload />}
        </div>
      </div>
    </div>
  );
};

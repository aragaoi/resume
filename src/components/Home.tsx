'use client';

import React, { useState, useEffect } from 'react';
import { Resume } from '../components/Resume';
import { TemplateDownload } from '../components/TemplateDownload';
import { parseResumeFile } from '../utils/parser';
import type { Resume as ResumeType } from '../types/Resume';

const STORAGE_KEY = 'savedResume';

export function Home() {
  const [resume, setResume] = useState<ResumeType | null>(null);
  const [error, setError] = useState<string>('');
  const [rememberFile, setRememberFile] = useState(false);

  useEffect(() => {
    const loadSavedResume = async () => {
      const savedResume = localStorage.getItem(STORAGE_KEY);
      if (savedResume) {
        try {
          setResume(JSON.parse(savedResume));
          return true;
        } catch (err) {
          console.error('Error loading saved resume:', err);
        }
      }
      return false;
    };

    const loadDefaultResume = async () => {
      const defaultPath = process.env.NEXT_PUBLIC_DEFAULT_RESUME_PATH;
      if (defaultPath) {
        try {
          const response = await fetch(defaultPath);
          const content = await response.text();
          const fileType = defaultPath.split('.').pop()?.toLowerCase() || '';
          const parsedResume = await parseResumeFile(content, fileType);
          setResume(parsedResume);
        } catch (err) {
          console.error('Error loading default resume:', err);
        }
      }
    };

    const init = async () => {
      const hasSavedResume = await loadSavedResume();
      if (!hasSavedResume) {
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
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';
      const parsedResume = await parseResumeFile(content, fileType);
      setResume(parsedResume);
      setError('');

      if (rememberFile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedResume));
      }
    } catch (err) {
      setError('Error parsing resume file. Please check the format and try again.');
      console.error(err);
    }
  };

  if (!resume) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-primary mb-6 text-center">Resume Builder</h1>
          <div className="space-y-6">
            <div>
              <p className="text-center mb-4 text-gray-600">
                Upload your resume file (JSON, YAML, Markdown, or TXT)
              </p>
              <input
                type="file"
                accept=".json,.yml,.yaml,.md,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0 file:text-sm file:font-semibold
                  file:bg-primary file:text-white hover:file:bg-secondary
                  cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-center gap-2">
              <input
                type="checkbox"
                checked={rememberFile}
                onChange={(e) => setRememberFile(e.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">Remember this file</span>
            </label>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 text-center mb-4">Need a template to start?</p>
              <TemplateDownload />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Resume resume={resume} onBack={() => setResume(null)} />;
}

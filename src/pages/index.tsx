import React, { useState, useEffect } from 'react';
import { Resume } from '../components/Resume';
import { TemplateDownload } from '../components/TemplateDownload';
import { parseResumeFile } from '../utils/parser';
import type { Resume as ResumeType } from '../types/Resume';

const STORAGE_KEY = 'savedResume';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {!resume ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Resume Builder</h1>
          <p className="mb-4">Upload your resume file (JSON, YAML, Markdown, or TXT)</p>
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              accept=".json,.yml,.yaml,.md,.txt"
              onChange={handleFileUpload}
              className="block w-full max-w-xs text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberFile}
                onChange={(e) => setRememberFile(e.target.checked)}
                className="rounded text-blue-600"
              />
              Remember this file
            </label>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Need a template to start?</p>
              <TemplateDownload />
            </div>
          </div>
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      ) : (
        <div>
          <div className="max-w-4xl mx-auto pt-4 px-4">
            <button
              onClick={() => {
                setResume(null);
                if (!rememberFile) {
                  localStorage.removeItem(STORAGE_KEY);
                }
              }}
              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-100"
            >
              Upload Different File
            </button>
          </div>
          <Resume resume={resume} />
        </div>
      )}
    </div>
  );
}

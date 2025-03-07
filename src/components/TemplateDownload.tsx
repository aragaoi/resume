import React from 'react';
import { FileDown } from 'lucide-react';

const templates = [
  { name: 'Plain Text', file: 'resume.txt', description: 'Simple and clean format' },
  { name: 'Markdown', file: 'resume.md', description: 'Rich text with formatting' },
  { name: 'JSON', file: 'resume.json', description: 'Structured data format' },
  { name: 'YAML', file: 'resume.yml', description: 'Human-friendly data format' },
];

export const TemplateDownload: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {templates.map((template) => (
        <div key={template.file} className="card bg-base-200">
          <div className="card-body p-4">
            <h3 className="card-title text-lg">{template.name}</h3>
            <p>{template.description}</p>
            <div className="card-actions justify-end mt-2">
              <a href={`/templates/${template.file}`} download className="btn btn-primary btn-sm">
                <FileDown className="w-4 h-4 mr-2" />
                Download Template
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

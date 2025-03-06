import React from 'react';

const templates = [
  { name: 'Plain Text', file: 'resume.txt' },
  { name: 'Markdown', file: 'resume.md' },
  { name: 'JSON', file: 'resume.json' },
  { name: 'YAML', file: 'resume.yml' },
];

export const TemplateDownload: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {templates.map((template) => (
        <a
          key={template.file}
          href={`/templates/${template.file}`}
          download
          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-blue-100"
        >
          Download {template.name} Template
        </a>
      ))}
    </div>
  );
};

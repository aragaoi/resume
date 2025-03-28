export interface Website {
  url: string;
  type: string;
  label?: string;
}

export interface Period {
  start: string;
  end?: string;
}

export interface ResumeItem {
  title: string;
  subtitle?: string;

  // Unified time representation
  // Instead of having both date and period, use only period
  // For simple dates, just use start field of period
  period?: Period;

  description?: string;

  // List content - bullet points, skill items, etc.
  // Now always contains strings
  content?: string[];

  // Tags can be any type, not just strings
  tags?: any[];

  // For nested items like skills categories
  items?: ResumeItem[];
}

export interface ResumeSection {
  title: string;
  items: ResumeItem[];
}

export interface Resume {
  name: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    websites?: Website[];
  };
  sections: ResumeSection[];
}

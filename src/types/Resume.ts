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
  date?: string;
  period?: Period;
  description?: string;
  details?: string[];
  content?: string[];
  tags?: string[];
  items?: ResumeItem[]; // For nested items like skills categories
}

export interface ResumeSection {
  title: string;
  period?: Period;
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

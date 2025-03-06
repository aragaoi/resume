export interface Website {
  url: string;
  type: string;
  label?: string;
}

export interface Period {
  start: string;
  end?: string;
}

export interface ResumeSection {
  title: string;
  period?: Period;
  content: string | string[] | ResumeSection[];
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

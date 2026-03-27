export interface Section {
  id: string;
  goal: string; // e.g. "understand what time they wake up and why"
  condition?: {
    sectionId: string;
    keyword: string; // show this section if a prior section's summary contains this keyword
  };
}

export interface Form {
  id: string;
  title: string;
  intentPrompt: string; // overall purpose of the form
  sections: Section[];
  estimatedMinutes: number;
  createdAt: string;
  creatorKey: string; // simple secret to view results
}

export interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export interface SectionResponse {
  sectionId: string;
  transcript: Message[];
  summary: string;
}

export interface Response {
  id: string;
  formId: string;
  sectionResponses: SectionResponse[];
  completedAt: string;
}

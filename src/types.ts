export interface ChatMessage {
  id: string;
  text: string;
  isFromUser: boolean;
  timestamp: string;
  isLoading?: boolean;
}

export interface CurriculumTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  completed: boolean;
  modulesCount: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  type: string;
  date: string;
  tags: string[];
  summary: string;
}

export interface Scripture {
  reference: string;
  text: string;
}

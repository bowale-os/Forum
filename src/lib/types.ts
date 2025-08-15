// Centralized types for the application
export interface Session {
  user: {
    id: string;
    email: string;
  };
}

export interface Profile {
  username: string;
}

export interface Topic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

export interface Reply {
  id: string;
  content: string;
  created_at: string;
  topic_id: string;
  profiles: Profile;
}

export interface User {
  id: string;
  email: string;
}

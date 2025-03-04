# WorkFlow - Modern Work Management Platform

A powerful work management platform built with React, Node.js, and GraphQL, inspired by monday.com.

## Features

- Board-based task and project management
- Real-time collaboration
- Customizable boards with drag-and-drop
- User authentication and permissions
- Dashboard views and data visualization
- Custom field types
- Workflow automation
- Document collaboration
- Activity logging and notifications
- Search functionality

## Tech Stack

- Frontend: React, TypeScript, Material-UI, Apollo Client
- Backend: Node.js, Express, GraphQL, MongoDB
- Real-time: Socket.IO
- Authentication: JWT, OAuth2
- File Storage: AWS S3
- Search: Elasticsearch

## Project Structure

```
workflow/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and external service integrations
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── models/        # Database models
│   │   ├── resolvers/     # GraphQL resolvers
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── tests/             # Backend tests
└── shared/                 # Shared types and utilities
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/workflow.git
cd workflow
```

2. Install dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Install additional dependencies
npm install type-graphql @supabase/supabase-js @types/node
```

3. Set up environment variables:
```bash
# In server directory
cp .env.example .env

# In client directory
cp .env.example .env
```

4. Start the development servers:
```bash
# Start backend server
cd server
npm run dev

# Start frontend server
cd client
npm start
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 
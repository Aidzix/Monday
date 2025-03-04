# Work Management Platform - Server

This is the backend server for the Work Management Platform, built with Node.js, Express, GraphQL, and MongoDB.

## Features

- User authentication with JWT
- GraphQL API with subscriptions for real-time updates
- MongoDB database integration
- File upload support
- Role-based access control
- Real-time collaboration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd work-management-platform/server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values.

## Development

Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:4000 with the GraphQL playground available at http://localhost:4000/graphql.

## Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Documentation

The GraphQL API documentation is available in the GraphQL playground when running the server.

### Main Queries

- `me`: Get the current user
- `boards`: Get all boards for the current user
- `board(id: ID!)`: Get a specific board
- `items(boardId: ID!)`: Get all items in a board
- `item(id: ID!)`: Get a specific item
- `groups(boardId: ID!)`: Get all groups in a board
- `columns(boardId: ID!)`: Get all columns in a board

### Main Mutations

- `register(input: RegisterInput!)`: Register a new user
- `login(input: LoginInput!)`: Login user
- `createBoard(input: CreateBoardInput!)`: Create a new board
- `updateBoard(id: ID!, input: UpdateBoardInput!)`: Update a board
- `deleteBoard(id: ID!)`: Delete a board
- `createItem(input: CreateItemInput!)`: Create a new item
- `updateItem(id: ID!, input: UpdateItemInput!)`: Update an item
- `deleteItem(id: ID!)`: Delete an item
- `moveItem(id: ID!, groupId: ID!, index: Int!)`: Move an item to a different group
- `createGroup(input: CreateGroupInput!)`: Create a new group
- `updateGroup(boardId: ID!, groupId: ID!, input: UpdateGroupInput!)`: Update a group
- `deleteGroup(boardId: ID!, groupId: ID!)`: Delete a group
- `reorderGroups(boardId: ID!, groupIds: [ID!]!)`: Reorder groups in a board
- `createColumn(input: CreateColumnInput!)`: Create a new column
- `updateColumn(boardId: ID!, columnId: ID!, input: UpdateColumnInput!)`: Update a column
- `deleteColumn(boardId: ID!, columnId: ID!)`: Delete a column
- `reorderColumns(boardId: ID!, columnIds: [ID!]!)`: Reorder columns in a board
- `addMember(boardId: ID!, userId: ID!)`: Add a member to a board
- `removeMember(boardId: ID!, userId: ID!)`: Remove a member from a board

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
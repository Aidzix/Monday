import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      title
      description
      memberIds
      createdAt
      updatedAt
    }
  }
`;

const CREATE_BOARD = gql`
  mutation CreateBoard($title: String!, $description: String!) {
    createBoard(title: $title, description: $description) {
      id
      title
      description
      memberIds
      createdAt
      updatedAt
    }
  }
`;

interface Board {
  id: string;
  title: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_BOARDS);
  const [createBoard] = useMutation(CREATE_BOARD, {
    refetchQueries: [{ query: GET_BOARDS }],
  });

  const handleCreateBoard = async () => {
    try {
      const { data } = await createBoard({
        variables: { title, description },
      });
      setOpen(false);
      setTitle('');
      setDescription('');
      navigate(`/board/${data.createBoard.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading boards</div>;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Boards
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Create Board
        </Button>
      </Box>

      <Grid container spacing={3}>
        {data.boards.map((board: Board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <CardContent>
                <Typography variant="h6" component="h2">
                  {board.title}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {board.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {new Date(board.updatedAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Board Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBoard} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 